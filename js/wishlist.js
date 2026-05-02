import { doc, setDoc, collection, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";
import { Toast } from "./toast.js";

export class WishlistManager {
    constructor() {
        this.db = null;
        this.userId = null;
        this.items = [];
        this.unsubscribe = null;
    }

    setDatabase(db) {
        this.db = db;
    }

    setUserId(uid) {
        this.userId = uid;

        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }

        if (uid && this.db) {
            const wishlistRef = collection(this.db, "users", uid, "wishlist");
            this.unsubscribe = onSnapshot(wishlistRef, (snapshot) => {
                this.items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                this.updateWishlistUI();
            }, (error) => {
                console.error("Wishlist listener error:", error);
            });
        } else {
            this.items = [];
            this.updateWishlistUI();
        }
    }

    async toggleItem(artwork) {
        if (!this.userId || !this.db) {
            Toast.show('Please log in to save items to your wishlist', 'error');
            return;
        }

        const existing = this.items.find(i => i.id === artwork.id);
        if (existing) {
            await deleteDoc(doc(this.db, "users", this.userId, "wishlist", artwork.id));
            Toast.show('Removed from Wishlist', 'info');
        } else {
            await setDoc(doc(this.db, "users", this.userId, "wishlist", artwork.id), artwork);
            Toast.show('Added to Wishlist');
        }
    }

    async removeItem(id) {
        if (this.userId && this.db) {
            await deleteDoc(doc(this.db, "users", this.userId, "wishlist", id));
            Toast.show('Removed from Wishlist', 'info');
        }
    }

    isInWishlist(id) {
        return this.items.some(item => item.id === id);
    }

    updateWishlistUI() {
        // Dispatch event for UI updates
        window.dispatchEvent(new CustomEvent('wishlistUpdated', { detail: this.items }));
    }
}

export const wishlist = new WishlistManager();

