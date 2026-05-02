import { doc, setDoc, collection, addDoc, deleteDoc, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";
import { Toast } from "./toast.js";

export class CartManager {
    constructor() {
        this.db = null;
        this.userId = null;
        this.storageKey = 'varmaGalleryCart_guest';
        this.items = JSON.parse(localStorage.getItem(this.storageKey)) || [];
        this.unsubscribe = null;
        this.initListeners();
    }

    setDatabase(db) {
        this.db = db;
    }

    async setUserId(uid) {
        const previousKey = this.storageKey;
        this.userId = uid;
        this.storageKey = uid ? `varmaGalleryCart_${uid}` : 'varmaGalleryCart_guest';

        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }

        if (uid && this.db) {
            // First, migrate guest cart to Firestore subcollection if exists
            const guestItems = JSON.parse(localStorage.getItem('varmaGalleryCart_guest')) || [];
            if (guestItems.length > 0) {
                for (const item of guestItems) {
                    const cartRef = doc(this.db, "users", uid, "cart", item.id);
                    // Add previous guest cart items to the subcollection
                    // Note: If item already exists, we could merge quantities, but for simplicity setDoc merges.
                    await setDoc(cartRef, { ...item, quantity: item.quantity }, { merge: true });
                }
                localStorage.removeItem('varmaGalleryCart_guest');
            }

            // Set up real-time listener for the subcollection
            const cartCollectionRef = collection(this.db, "users", uid, "cart");
            this.unsubscribe = onSnapshot(cartCollectionRef, (snapshot) => {
                this.items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                this.updateCartUI();
            }, (error) => {
                console.error("Cart listener error:", error);
            });
        } else {
            this.items = JSON.parse(localStorage.getItem(this.storageKey)) || [];
            this.updateCartUI();
        }
    }

    saveGuestCart() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.items));
        this.updateCartUI();
    }

    async clearCart() {
        if (this.userId && this.db) {
            const cartCollectionRef = collection(this.db, "users", this.userId, "cart");
            const snap = await getDocs(cartCollectionRef);
            const deletions = snap.docs.map(document => deleteDoc(doc(this.db, "users", this.userId, "cart", document.id)));
            await Promise.all(deletions);
        } else {
            this.items = [];
            localStorage.removeItem(this.storageKey);
            this.updateCartUI();
        }
    }

    async saveOrder(paymentId, userEmail) {
        if (!this.userId || !this.db) throw new Error("User not logged in");
        
        const orderData = {
            userId: this.userId,
            email: userEmail || "customer@example.com",
            items: this.items,
            totalAmount: this.getTotalPrice(),
            paymentStatus: "SUCCESS",
            paymentId: paymentId,
            status: "Processing", // New Order Status
            createdAt: new Date().toISOString()
        };

        const orderRef = await addDoc(collection(this.db, "orders"), orderData);
        console.log("Order saved with ID: ", orderRef.id);
        
        // Trigger EmailJS Receipt
        this.sendEmailReceipt(orderData, orderRef.id);
        
        return orderRef.id;
    }

    sendEmailReceipt(orderData, orderId) {
        if (typeof emailjs === "undefined") {
            console.warn("EmailJS not loaded. Cannot send receipt.");
            return;
        }

        emailjs.init("YOUR_EMAILJS_PUBLIC_KEY"); // Replace with EmailJS Public Key

        const templateParams = {
            to_email: orderData.email,
            order_id: orderId,
            payment_id: orderData.paymentId,
            total_amount: "$" + orderData.totalAmount.toLocaleString(),
            items_count: orderData.items.length
        };

        emailjs.send("YOUR_EMAILJS_SERVICE_ID", "YOUR_EMAILJS_TEMPLATE_ID", templateParams)
            .then(response => console.log("Email receipt sent successfully!", response))
            .catch(error => console.error("Failed to send email receipt:", error));
    }

    async addItem(artwork, size = 'Standard', frame = 'none') {
        // Unique ID for product + size + frame combination
        const cartItemId = `${artwork.id}_${size.replace(/\s+/g, '')}_${frame}`; 
        const itemData = { 
            ...artwork, 
            id: cartItemId, 
            productId: artwork.id, 
            size, 
            frame, 
            quantity: 1 
        };

        if (this.userId && this.db) {
            const existingItem = this.items.find(item => item.id === cartItemId);
            if (existingItem) {
                itemData.quantity = existingItem.quantity + 1;
            }
            await setDoc(doc(this.db, "users", this.userId, "cart", cartItemId), itemData);
        } else {
            const existingItem = this.items.find(item => item.id === cartItemId);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                this.items.push(itemData);
            }
            this.saveGuestCart();
        }
        Toast.show('Added to Cart');
    }

    async removeItem(id) {
        if (this.userId && this.db) {
            await deleteDoc(doc(this.db, "users", this.userId, "cart", id));
        } else {
            this.items = this.items.filter(item => item.id !== id);
            this.saveGuestCart();
        }
        Toast.show('Removed from Cart', 'info');
    }

    async updateQuantity(id, quantity) {
        if (quantity <= 0) {
            return this.removeItem(id);
        }
        if (this.userId && this.db) {
            await setDoc(doc(this.db, "users", this.userId, "cart", id), { quantity: parseInt(quantity, 10) }, { merge: true });
        } else {
            const item = this.items.find(item => item.id === id);
            if (item) {
                item.quantity = parseInt(quantity, 10);
                this.saveGuestCart();
            }
        }
    }

    getTotalItems() {
        return this.items.reduce((total, item) => total + item.quantity, 0);
    }

    getTotalPrice() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    updateCartUI() {
        const countSpan = document.getElementById('cartCount');
        if (countSpan) {
            countSpan.textContent = this.getTotalItems();
        }
        // Trigger a custom event in case other components need to know
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: this.items }));
    }

    initListeners() {
        this.updateCartUI();
    }
}

export const cart = new CartManager();

