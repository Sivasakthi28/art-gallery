import { pages, renderProductCard } from './pages.js';
import { cart } from './cart.js';
import { Toast } from './toast.js';
import { wishlist } from './wishlist.js';
import { initProducts, artworks, initReviews, reviews } from './products.js';
import { recent } from './recent.js';

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut }
    from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, setDoc, getDoc, deleteDoc, query, where, getDocs, orderBy, updateDoc, onSnapshot, serverTimestamp }
    from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, uploadString, getDownloadURL }
    from "https://www.gstatic.com/firebasejs/12.12.1/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyAUJZSMncEDKT4BT4zfFRt-BCUUzQs5z9Q",
    authDomain: "art-gallery-6b527.firebaseapp.com",
    projectId: "art-gallery-6b527",
    storageBucket: "art-gallery-6b527.appspot.com",
    messagingSenderId: "890969007358",
    appId: "1:890969007358:web:a1552374c303c62b9cf1af"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

class App {
    constructor() {
        window.appInstance = this; // Make instance globally accessible
        this.appElement = document.getElementById('main-content');
        this.currentRoute = 'home';
        this.activeAdminTab = 'orders';
        this.analyticsData = null;
        this.appliedCoupon = null;
        this.appliedCoupon = null;
        this.isProcessingPayment = false;
        
        // Advanced Features State
        this.frames = [];
        this.cropper = null;
        
        // Slider State
        this.sliderIndex = 0;
        this.sliderInterval = null;
        
        this.currency = localStorage.getItem('currency') || 'INR';
        this.language = localStorage.getItem('language') || 'en';
        
        this.translations = {
            en: {
                home: "Home", shop: "Gallery", about: "Legacy", contact: "Contact",
                wishlist: "Wishlist", cart: "Cart", login: "Login", logout: "Logout",
                admin: "Admin", myOrders: "My Orders",
                explore: "Explore Collection", search: "Search by title or artist...",
                allMediums: "All Mediums", allPrices: "All Prices", sortBy: "Sort by",
                featured: "Featured", lowToHigh: "Price: Low to High", highToHigh: "Price: High to Low",
                addToCart: "Add to Cart", outOfStock: "Out of Stock", unavailable: "Unavailable",
                limitedEdition: "Limited Edition", inStock: "In Stock",
                description: "Description", medium: "Medium", dimensions: "Dimensions",
                reviews: "Customer Reviews", writeReview: "Write a Review", postReview: "Post Review",
                subtotal: "Subtotal", shipping: "Shipping", total: "Total", checkout: "Checkout",
                emptyCart: "Your Cart is Empty", continueShopping: "Continue Shopping"
            },
            ta: {
                home: "முகப்பு", shop: "கேலரி", about: "வரலாறு", contact: "தொடர்பு",
                wishlist: "விருப்பப்பட்டியல்", cart: "கார்ட்", login: "உள்நுழை", logout: "வெளியேறு",
                admin: "நிர்வாகி", myOrders: "எனது ஆர்டர்கள்",
                explore: "தொகுப்பை ஆராயுங்கள்", search: "தலைப்பு அல்லது கலைஞர் மூலம் தேடுங்கள்...",
                allMediums: "அனைத்து ஊடகங்கள்", allPrices: "அனைத்து விலைகள்", sortBy: "வரிசைப்படுத்து",
                featured: "சிறப்பு", lowToHigh: "விலை: குறைவு முதல் அதிகம்", highToHigh: "விலை: அதிகம் முதல் குறைவு",
                addToCart: "கார்டில் சேர்", outOfStock: "இருப்பு இல்லை", unavailable: "கிடைக்கவில்லை",
                limitedEdition: "வரையறுக்கப்பட்ட பதிப்பு", inStock: "இருப்பில் உள்ளது",
                description: "விளக்கம்", medium: "ஊடகம்", dimensions: "அளவுகள்",
                reviews: "வாடிக்கையாளர் மதிப்புரைகள்", writeReview: "மதிப்புரை எழுதுங்கள்", postReview: "மதிப்புரையை இடுகையிடவும்",
                subtotal: "கூட்டுத்தொகை", shipping: "ஷிப்பிங்", total: "மொத்தம்", checkout: "செக்அவுட்",
                emptyCart: "உங்கள் கார்ட் காலியாக உள்ளது", continueShopping: "தொடர்ந்து ஷாப்பிங் செய்யுங்கள்"
            }
        };

        this.selectedVariants = {}; // Track selected variants per product
        this.init();
    }

    init() {
        initProducts(db, () => {
            console.log("🔥 Products loaded, rendering UI...");
            this.render(); 
        });
        initReviews(db, () => {
            console.log("⭐ Reviews updated...");
            this.render();
        });
        cart.setDatabase(db);
        wishlist.setDatabase(db);
        this.bindGlobalEvents();
        window.addEventListener('hashchange', () => {
            console.log('🔗 Hash changed, re-routing...');
            this.handleRoute();
        });

        this.initFrames();
        this.handleRoute();

        // ======================
        // ✅ AUTH LOGIC & MODAL
        // ======================
        const modal = document.getElementById("authModal");
        const userBtn = document.getElementById("userBtn");
        const closeBtn = document.getElementById("closeAuth");

        this.user = null;

        onAuthStateChanged(auth, (user) => {
            this.user = user;
            if (user) {
                userBtn.innerHTML = "🚪"; // Logout icon
                userBtn.title = "Log Out";
            } else {
                userBtn.innerHTML = "👤"; // Login icon
                userBtn.title = "Log In";
            }

            // Connect the user to the cart and wishlist
            cart.setUserId(user ? user.uid : null);
            wishlist.setUserId(user ? user.uid : null);
            if (this.currentRoute === 'cart' || this.currentRoute === 'wishlist') {
                this.render();
            }
        });

        userBtn?.addEventListener("click", () => {
            if (this.user) {
                if (confirm("Are you sure you want to log out?")) {
                    signOut(auth).then(() => {
                        alert("Logged out successfully!");
                        this.navigate('home');
                    });
                }
            } else {
                this.navigate('login');
            }
        });

        closeBtn?.addEventListener("click", () => {
            modal.style.display = "none";
        });

        window.addEventListener("click", (e) => {
            if (e.target === modal) modal.style.display = "none";
            const prodModal = document.getElementById('add-product-modal');
            if (e.target === prodModal) this.resetProductForm();
        });

        // ======================
        // 🔥 SIGNUP (FIXED)
        // ======================
        document.getElementById("signupBtn")?.addEventListener("click", async () => {
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            if (!email || !password) {
                alert("Enter email & password");
                return;
            }

            try {
                const userCredential = await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

                console.log("User created:", userCredential.user);

                alert("Signup Successful ✅");

                modal.style.display = "none";

            } catch (error) {
                console.error(error);
                alert(error.message);
            }
        });

        // ======================
        // 📱 MOBILE MENU
        // ======================
        const menuToggle = document.getElementById('mobile-menu-toggle');
        const mainNav = document.getElementById('main-nav');
        const overlay = document.getElementById('mobile-overlay');

        const toggleMenu = () => {
            menuToggle?.classList.toggle('active');
            mainNav?.classList.toggle('active');
            overlay?.classList.toggle('active');
            document.body.style.overflow = mainNav?.classList.contains('active') ? 'hidden' : '';
        };

        menuToggle?.addEventListener('click', toggleMenu);
        overlay?.addEventListener('click', toggleMenu);

        // Close menu logic moved to bindGlobalEvents

        // ======================
        // 🔍 SEARCH
        // ======================
        document.getElementById("searchBtn")?.addEventListener("click", () => {
            const query = prompt("Search artworks:");
            if (!query) return;

            const filtered = artworks.filter(a =>
                a.title.toLowerCase().includes(query.toLowerCase())
            );

            this.currentRoute = "shop";
            this.render();

            setTimeout(() => {
                const grid = document.getElementById("shop-grid");
                if (grid) {
                    grid.innerHTML = filtered.map(renderProductCard).join('');
                }
            }, 100);
        });

        // ======================
        // 🛒 CART
        // ======================
        window.addToCart = (id, frame = 'none') => {
            this.addToCart(id, frame);
        };

        window.removeFromCart = (id) => {
            cart.removeItem(id);
            if (this.currentRoute === 'cart') this.render();
        };

        window.updateQuantity = (id, q) => {
            cart.updateQuantity(id, q);
            if (this.currentRoute === 'cart') this.render();
        };

        // ======================
        // ❤️ WISHLIST
        // ======================
        window.toggleWishlist = (id) => {
            const art = artworks.find(a => String(a.id) === String(id));
            if (art) wishlist.toggleItem(art);
        };

        window.removeFromWishlist = (id) => {
            wishlist.removeItem(id);
            if (this.currentRoute === 'wishlist') this.render();
        };

        window.moveToCart = (id) => {
            const item = wishlist.items.find(i => i.id === id);
            if (item) {
                cart.addItem(item, 'Standard', 'none');
                wishlist.removeItem(id);
            }
        };

        window.selectSize = (size, price, stock, el) => {
            this.selectSize(size, price, stock, el);
        };

        // ======================
        // CARD MODAL LOGIC
        // ======================
        window.openCardModal = () => {
            const modal = document.getElementById('cardModal');
            if (modal) modal.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Lock scrolling
        };

        window.closeCardModal = () => {
            const modal = document.getElementById('cardModal');
            if (modal) modal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Unlock scrolling
        };

        window.submitCardModal = () => {
            const cardNum = document.getElementById('card-number').value.replace(/\s+/g, '');
            const cardName = document.getElementById('card-name').value.trim();
            const expMonth = document.getElementById('card-exp-month').value;
            const expYear = document.getElementById('card-exp-year').value;
            const cvv = document.getElementById('card-cvv').value.trim();

            if (cardNum.length < 15 || !cardName || !expMonth || !expYear || cvv.length < 3) {
                alert("Please fill in all card details correctly.");
                return;
            }

            // Update UI Preview
            const last4 = cardNum.slice(-4);
            const preview = document.getElementById('card-details-preview');
            const savedText = document.getElementById('saved-card-text');
            const linkContainer = document.getElementById('add-card-link-container');

            if (preview && savedText && linkContainer) {
                savedText.innerText = `Card ending in ${last4}`;
                preview.style.display = 'block';
                linkContainer.style.display = 'none';
            }
            
            // Ensure Card radio is selected
            const cardRadio = document.querySelector('input[name="payment-method"][value="card"]');
            if (cardRadio) cardRadio.checked = true;

            window.closeCardModal();
            this.showToast("Card details added successfully!", "success");
        };

        // Close on ESC or Outside Click
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') window.closeCardModal();
        });
        window.addEventListener('mousedown', (e) => {
            const modal = document.getElementById('cardModal');
            if (e.target === modal) window.closeCardModal();
        });

        window.toggleCartItemSelection = async (id, checked) => {
            await cart.toggleSelection(id, checked);
            this.navigate('cart'); // Refresh cart view
        };

        window.toggleAllCartSelection = async (checked) => {
            await cart.toggleAllSelection(checked);
            this.navigate('cart'); // Refresh cart view
        };

        window.proceedToCheckout = () => {
            if (!this.user) {
                alert("Please log in to proceed to checkout.");
                this.navigate('login');
                return;
            }
            const selectedItems = cart.getSelectedItems();
            if (selectedItems.length === 0) {
                alert("Please select at least one item to checkout.");
                return;
            }
            this.selectedCheckoutItems = selectedItems;
            this.navigate('checkout');
        };

        window.processCheckout = async (form) => {
            const formData = new FormData(form);
            const email = formData.get('email');
            const phone = formData.get('phone');
            const deliveryInstructions = formData.get('deliveryInstructions') || "";
            const address = {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                street: formData.get('address'),
                city: formData.get('city'),
                state: formData.get('state'),
                zip: formData.get('zip'),
            };
            const paymentMethod = formData.get('payment-method');

            const orderDetails = { address, paymentMethod, email, phone, deliveryInstructions };

            if (paymentMethod === 'cod') {
                await this.placeCODOrder(orderDetails);
            } else {
                window.payNow(orderDetails);
            }
        };

        window.payNow = async (orderDetails) => {
            if (this.isProcessingPayment) return;

            if (!this.user) {
                alert("Please log in to proceed with payment.");
                this.navigate('login');
                return;
            }

            const checkoutItems = this.selectedCheckoutItems || cart.getSelectedItems();
            const subtotal = checkoutItems.reduce((total, item) => total + (item.price * item.quantity), 0);
            let discount = 0;
            if (this.appliedCoupon) {
                discount = this.appliedCoupon.type === 'percentage' 
                    ? (subtotal * this.appliedCoupon.value) / 100 
                    : this.appliedCoupon.value;
            }

            const totalAmount = Math.max(0, subtotal - discount);
            if (totalAmount <= 0) {
                alert("Your cart is empty or total is zero.");
                return;
            }

            this.isProcessingPayment = true;

            if (typeof window.Razorpay === 'undefined') {
                const loaded = await new Promise((resolve) => {
                    const script = document.createElement('script');
                    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                    script.onload = () => resolve(true);
                    script.onerror = () => resolve(false);
                    document.body.appendChild(script);
                });
                
                if (!loaded) {
                    this.isProcessingPayment = false;
                    alert("Could not load payment gateway. Please ensure you are connected to the internet and check if an adblocker is active.");
                    return;
                }
            }

            const options = {
                key: "rzp_test_ShLcmmo3kCtpxZ", // IMPORTANT: Never use your Key Secret here!
                amount: Math.round(totalAmount * 100), // Amount in paise (integer)
                currency: "INR", // INR is strictly required for UPI methods
                name: "Aura Art Gallery",
                description: "Purchase of Artworks",
                prefill: {
                    name: this.user.displayName || (orderDetails.address ? `${orderDetails.address.firstName} ${orderDetails.address.lastName}` : "Art Collector"),
                    email: orderDetails.email || this.user.email,
                    contact: orderDetails.phone || "9999999999" 
                },
                theme: {
                    color: "#D4AF37"
                },
                handler: async function (response) {
                    try {
                        const paymentId = response.razorpay_payment_id;
                        const orderData = {
                            userId: window.appInstance.user.uid,
                            customerName: orderDetails.address ? `${orderDetails.address.firstName} ${orderDetails.address.lastName}` : "Unknown",
                            email: orderDetails.email || window.appInstance.user.email,
                            phoneNumber: orderDetails.phone || null,
                            deliveryInstructions: orderDetails.deliveryInstructions || "",
                            deliveryAddress: orderDetails.address ? {
                                street: orderDetails.address.street,
                                city: orderDetails.address.city,
                                state: orderDetails.address.state,
                                pincode: orderDetails.address.zip
                            } : null,
                            items: checkoutItems.map(item => ({
                                productId: item.productId || item.id,
                                title: item.title,
                                size: item.size || 'Standard',
                                frame: item.frame || 'none',
                                quantity: item.quantity,
                                price: item.price,
                                subtotal: item.price * item.quantity
                            })),
                            paymentDetails: {
                                paymentMethod: orderDetails.paymentMethod,
                                paymentStatus: 'Paid',
                                paymentId: paymentId
                            },
                            priceSummary: {
                                subtotal: subtotal,
                                discount: discount,
                                deliveryCharge: 0,
                                totalAmount: totalAmount
                            },
                            totalAmount: totalAmount, // for easy querying
                            status: "Processing",
                            createdAt: serverTimestamp()
                        };
                        await addDoc(collection(db, "orders"), orderData);

                        // Reduce Stock
                        for (const item of checkoutItems) {
                            const artRef = doc(db, "products", item.productId || item.id);
                            const artDoc = artworks.find(a => a.id === (item.productId || item.id));
                            if (artDoc) {
                                if (artDoc.variants && item.size) {
                                    const updatedVariants = artDoc.variants.map(v => {
                                        if (v.size === item.size) {
                                            return { ...v, stock: Math.max(0, v.stock - item.quantity) };
                                        }
                                        return v;
                                    });
                                    await updateDoc(artRef, { variants: updatedVariants });
                                } else {
                                    await updateDoc(artRef, {
                                        stock: Math.max(0, (artDoc.stock || 1) - item.quantity)
                                    });
                                }
                            }
                        }

                        await cart.removeItems(checkoutItems);
                        window.appInstance.selectedCheckoutItems = null;
                        window.appInstance.showToast("Order placed successfully!", "success");
                        window.appInstance.navigate('success', paymentId);
                    } catch (err) {
                        console.error("Order Save Error:", err);
                        window.appInstance.showToast("Error saving order. Contact support.", "error");
                        window.appInstance.isProcessingPayment = false;
                    }
                },
                modal: {
                    ondismiss: function () {
                        console.log("Payment popup closed");
                        window.appInstance.isProcessingPayment = false;
                    }
                }
            };

            try {
                const rzp = new window.Razorpay(options);
                rzp.on('payment.failed', function (response) {
                    window.appInstance.isProcessingPayment = false;
                    console.error("Razorpay Payment Error:", response.error);
                    if (confirm("Payment Failed: " + (response.error?.description || "Network Issue") + "\n\nWould you like to simulate a successful payment to test the checkout flow?")) {
                        window.appInstance.isProcessingPayment = true;
                        options.handler({ razorpay_payment_id: "pay_mock_" + Date.now() });
                    }
                });
                rzp.open();
            } catch (error) {
                this.isProcessingPayment = false;
                console.error("Razorpay init error:", error);
                
                if (confirm("Razorpay API could not be reached (likely blocked by an adblocker or slow network).\n\nWould you like to simulate a successful payment to continue testing the application?")) {
                    this.isProcessingPayment = true;
                    const fakePaymentId = "pay_mock_net_" + Date.now();
                    const orderData = {
                        userId: this.user.uid,
                        customerName: orderDetails.address ? `${orderDetails.address.firstName} ${orderDetails.address.lastName}` : "Unknown",
                        email: this.user.email,
                        phoneNumber: orderDetails.phone || null,
                        deliveryInstructions: orderDetails.deliveryInstructions || "",
                        deliveryAddress: orderDetails.address ? {
                            street: orderDetails.address.street,
                            city: orderDetails.address.city,
                            state: orderDetails.address.state,
                            pincode: orderDetails.address.zip
                        } : null,
                        items: checkoutItems.map(item => ({
                            productId: item.productId || item.id,
                            title: item.title,
                            size: item.size || 'Standard',
                            frame: item.frame || 'none',
                            quantity: item.quantity,
                            price: item.price,
                            subtotal: item.price * item.quantity
                        })),
                        paymentDetails: {
                            paymentMethod: orderDetails.paymentMethod,
                            paymentStatus: 'Paid',
                            paymentId: fakePaymentId
                        },
                        priceSummary: {
                            subtotal: subtotal,
                            discount: discount,
                            deliveryCharge: 0,
                            totalAmount: totalAmount
                        },
                        totalAmount: totalAmount,
                        status: "Processing",
                        createdAt: serverTimestamp()
                    };
                    await cart.removeItems(checkoutItems);
                    this.selectedCheckoutItems = null;
                    addDoc(collection(db, "orders"), orderData)
                        .then(() => {
                            this.isProcessingPayment = false;
                            this.navigate('success', fakePaymentId);
                        })
                        .catch(err => {
                            this.isProcessingPayment = false;
                            alert("Failed to save mock order.");
                            console.error(err);
                        });
                }
            }
        };
    }

    async placeCODOrder(orderDetails) {
        if (this.isProcessingPayment) return;
        this.isProcessingPayment = true;

        const checkoutItems = this.selectedCheckoutItems || cart.getSelectedItems();
        const subtotal = checkoutItems.reduce((total, item) => total + (item.price * item.quantity), 0);
        let discount = 0;
        if (this.appliedCoupon) {
            discount = this.appliedCoupon.type === 'percentage' 
                ? (subtotal * this.appliedCoupon.value) / 100 
                : this.appliedCoupon.value;
        }

        const totalAmount = Math.max(0, subtotal - discount);

        try {
            const orderId = "cod_" + Date.now();
            const orderData = {
                userId: this.user.uid,
                customerName: orderDetails.address ? `${orderDetails.address.firstName} ${orderDetails.address.lastName}` : "Unknown",
                email: orderDetails.email || this.user.email,
                phoneNumber: orderDetails.phone || null,
                deliveryInstructions: orderDetails.deliveryInstructions || "",
                deliveryAddress: orderDetails.address ? {
                    street: orderDetails.address.street,
                    city: orderDetails.address.city,
                    state: orderDetails.address.state,
                    pincode: orderDetails.address.zip
                } : null,
                items: checkoutItems.map(item => ({
                    productId: item.productId || item.id,
                    title: item.title,
                    size: item.size || 'Standard',
                    frame: item.frame || 'none',
                    quantity: item.quantity,
                    price: item.price,
                    subtotal: item.price * item.quantity
                })),
                paymentDetails: {
                    paymentMethod: 'cod',
                    paymentStatus: 'Pending',
                    paymentId: orderId
                },
                priceSummary: {
                    subtotal: subtotal,
                    discount: discount,
                    deliveryCharge: 0,
                    totalAmount: totalAmount
                },
                totalAmount: totalAmount,
                status: "Processing",
                createdAt: serverTimestamp()
            };

            const { addDoc, collection, doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
            const { db } = await import('./firebase-config.js');
            const { artworks } = await import('./products.js');

            await addDoc(collection(db, "orders"), orderData);

            // Reduce Stock
            for (const item of checkoutItems) {
                const artRef = doc(db, "products", item.productId || item.id);
                const artDoc = artworks.find(a => a.id === (item.productId || item.id));
                if (artDoc) {
                    if (artDoc.variants && item.size) {
                        const updatedVariants = artDoc.variants.map(v => {
                            if (v.size === item.size) {
                                return { ...v, stock: Math.max(0, v.stock - item.quantity) };
                            }
                            return v;
                        });
                        await updateDoc(artRef, { variants: updatedVariants });
                    } else {
                        await updateDoc(artRef, {
                            stock: Math.max(0, (artDoc.stock || 1) - item.quantity)
                        });
                    }
                }
            }

            await cart.removeItems(checkoutItems);
            this.selectedCheckoutItems = null;
            this.showToast("COD Order placed successfully!", "success");
            this.isProcessingPayment = false;
            this.navigate('success', orderId);
        } catch (err) {
            console.error("Order Save Error:", err);
            this.showToast("Error saving order. Contact support.", "error");
            this.isProcessingPayment = false;
        }
    }

    async initFrames() {
        try {
            onSnapshot(collection(db, "frames"), (snapshot) => {
                this.frames = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                console.log("🖼️ Frames loaded:", this.frames);
                if (this.currentRoute === 'product') {
                    this.render(); // Re-render product page to show new frames
                }
            });
        } catch (e) {
            console.error("Error loading frames:", e);
        }
    }

    // ======================
    // ROUTING
    // ======================
    bindGlobalEvents() {
        console.log('🔗 Binding global events...');
        document.addEventListener('click', (e) => {
            const linkElement = e.target.closest('[data-link]');
            if (linkElement) {
                // If we clicked an interactive element that handles its own action, ignore
                if (e.target.closest('.wishlist-btn, .quick-add, .nav-select, button:not([data-link])')) {
                    return; 
                }

                const route = linkElement.getAttribute('data-link');
                const param = linkElement.getAttribute('data-param');
                
                console.log(`🚀 Click triggered: ${route}${param ? ' (' + param + ')' : ''}`);
                
                e.preventDefault();
                e.stopPropagation();
                
                // Close mobile menu if it's open
                const mainNav = document.getElementById('main-nav');
                if (mainNav && mainNav.classList.contains('active')) {
                    document.getElementById('mobile-menu-toggle')?.classList.remove('active');
                    mainNav.classList.remove('active');
                    document.getElementById('mobile-overlay')?.classList.remove('active');
                    document.body.style.overflow = '';
                }

                this.navigate(route, param);
            }
        });

        window.addEventListener('scroll', () => {
            const header = document.getElementById('header');
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });

        document.getElementById('cartBtn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            // Close mobile menu if it's open
            const mainNav = document.getElementById('main-nav');
            if (mainNav && mainNav.classList.contains('active')) {
                document.getElementById('mobile-menu-toggle')?.classList.remove('active');
                mainNav.classList.remove('active');
                document.getElementById('mobile-overlay')?.classList.remove('active');
                document.body.style.overflow = '';
            }
            this.navigate('cart');
        });
    }

    navigate(route, param = null) {
        if (!route) return;
        const newHash = param ? `#${route}/${param}` : `#${route}`;
        console.log(`📍 Navigating to: ${newHash}`);
        
        // Updating hash will trigger the hashchange listener and handleRoute()
        if (window.location.hash === newHash) {
            this.handleRoute(); // Force re-render if hash is same
        } else {
            window.location.hash = newHash;
        }
    }

    handleRoute() {
        const hash = window.location.hash.slice(1);
        console.log('🔗 Handling initial route for hash:', hash);
        if (hash) {
            const parts = hash.split('/');
            // Handle #product/art2 format
            if (parts[0] === 'product' && parts[1]) {
                this.currentRoute = 'product';
                this.currentParam = parts[1];
            } else {
                this.currentRoute = parts[0] || 'home';
                this.currentParam = null;
            }
        } else {
            this.currentRoute = 'home';
            this.currentParam = null;
        }
        this.render();
    }

    render() {
        window.scrollTo(0, 0);
        console.log(`🖼️ Rendering Page: [${this.currentRoute}] with param: [${this.currentParam}]`);
        
        // Toggle header visibility mode based on route
        const header = document.getElementById('header');
        if (!header) return;

        if (this.currentRoute === 'home') {
            header.classList.add('on-hero');
        } else {
            header.classList.remove('on-hero');
            if (this.currentRoute === 'product') {
                window.currentFrame = localStorage.getItem(`frame_${this.currentParam}`) || 'none';
                // Wait for DOM to update then apply frame
                setTimeout(() => this.selectFrame(window.currentFrame), 0);
            }
        }

        // Clear slider interval if not on home
        if (this.currentRoute !== 'home' && this.sliderInterval) {
            console.log('⏸️ Clearing slider interval');
            clearInterval(this.sliderInterval);
            this.sliderInterval = null;
        }

        // Update active nav links
        document.querySelectorAll('.nav-links a').forEach(a => {
            a.classList.remove('active');
            if (a.getAttribute('data-link') === this.currentRoute) {
                a.classList.add('active');
            }
        });

        const pageRenderer = pages[this.currentRoute] || pages.home;
        this.appElement.innerHTML = pageRenderer(this.currentParam);

        if (this.currentRoute === 'home') {
            this.initSlider();
        }

        if (this.currentRoute === 'product' && this.currentParam) {
            const art = artworks.find(a => String(a.id) === String(this.currentParam));
            if (art) {
                // Requirement 1: Default to first variant if nothing selected yet
                if (art.variants && art.variants.length > 0 && !this.selectedVariants[art.id]) {
                    const def = art.variants[0];
                    this.selectedVariants[art.id] = { size: def.size, price: def.price, stock: def.stock };
                }
                recent.addProduct(art);
                if (!('ontouchstart' in window)) {
                    setTimeout(() => this.initImageZoom(), 100);
                }
            }
        }

        if (this.currentRoute === 'shop') {
            this.initShopFilters();
        } else if (this.currentRoute === 'login') {
            this.initLogin();
        } else if (this.currentRoute === 'my-orders') {
            this.initMyOrders();
        } else if (this.currentRoute === 'admin') {
            this.initAdminDashboard();
        } else if (this.currentRoute === 'success') {
            this.initSuccessPage(this.currentParam);
        } else if (this.currentRoute === 'track-order') {
            this.initTrackOrder(this.currentParam);
        }

        // Update nav visibility based on login/admin
        const adminLink = document.getElementById('nav-admin');
        const ordersLink = document.getElementById('nav-orders');
        if (adminLink) adminLink.style.display = (this.user && (this.user.email === 'admin@varmagallery.com' || this.user.email === 'admin@elegance.com')) ? 'block' : 'none';
        if (ordersLink) ordersLink.style.display = this.user ? 'block' : 'none';
    }

    // ======================
    // SUCCESS PAGE
    // ======================
    async initSuccessPage(paymentId) {
        const container = document.getElementById("order-details-container");
        if (!container) return;

        if (!paymentId) {
            container.innerHTML = `<p style="color: red;">Error: Invalid Payment ID.</p>`;
            return;
        }

        try {
            const q = query(collection(db, "orders"), where("paymentId", "==", paymentId));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                container.innerHTML = `<p style="color: red;">Order details not found.</p>`;
                return;
            }

            const order = querySnapshot.docs[0].data();
            let itemsHtml = (order.items || []).map(item => `<li>${item.title} x ${item.quantity} ${item.frame && item.frame !== 'none' ? `[${item.frame.charAt(0).toUpperCase() + item.frame.slice(1)} Frame]` : ''} - $${item.price.toLocaleString()}</li>`).join('');

            container.innerHTML = `
                <div style="text-align: left; background: #f9f9f9; padding: var(--space-md); border-radius: 8px;">
                    <p><strong>Order ID:</strong> ${querySnapshot.docs[0].id}</p>
                    <p><strong>Status:</strong> <span style="color: #D4AF37; font-weight: bold;">${order.status}</span></p>
                    <p><strong>Customer:</strong> ${order.customerName || 'N/A'}</p>
                    <p><strong>Email:</strong> ${order.email || 'N/A'}</p>
                    <p><strong>Phone:</strong> ${order.phoneNumber || 'N/A'}</p>
                    <h3 style="margin-top: var(--space-md);">Items Purchased</h3>
                    <ul style="margin-bottom: var(--space-md); padding-left: 20px;">
                        ${itemsHtml}
                    </ul>
                    <p style="font-size: 1.2rem; font-weight: bold;">Total: $${order.totalAmount.toLocaleString()}</p>
                </div>
            `;
        } catch (error) {
            console.error("Failed to fetch order:", error);
            container.innerHTML = `<p style="color: red;">Could not load order details.</p>`;
        }
    }

    // ======================
    // MY ORDERS PAGE
    // ======================
    async initMyOrders() {
        const container = document.getElementById("my-orders-container");
        if (!container || !this.user) return;

        try {
            const q = query(collection(db, "orders"), where("userId", "==", this.user.uid));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                container.innerHTML = "<p>You have no past orders.</p>";
                return;
            }

            // Since we don't have a composite index for orderBy("createdAt", "desc") yet, we sort in JS
            const orders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            orders.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
                return dateB - dateA;
            });

            let html = orders.map(order => `
                <div class="order-card" style="border: 1px solid var(--border-color); padding: var(--space-md); margin-bottom: var(--space-md); border-radius: 5px;">
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px;">
                        <div>
                            <strong>Order ID:</strong> ${order.id}<br>
                            <span style="font-size: 0.8rem; color: gray;">${order.createdAt ? (order.createdAt.toDate ? order.createdAt.toDate().toLocaleString() : new Date(order.createdAt).toLocaleString()) : 'N/A'}</span>
                        </div>
                        <div style="text-align: right;">
                            <strong>Status:</strong> <span style="color: ${order.status === 'Delivered' ? 'green' : '#D4AF37'};">${order.status}</span><br>
                            <strong>Total:</strong> $${order.totalAmount.toLocaleString()}
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>${order.items.map(i => `${i.title} (x${i.quantity})${i.frame && i.frame !== 'none' ? ` - ${i.frame} frame` : ''}`).join(', ')}</div>
                        <button class="btn" style="padding: 5px 15px; font-size: 0.8rem;" data-link="track-order" data-param="${order.id}">Track</button>
                    </div>
                </div>
            `).join('');
            container.innerHTML = html;
        } catch (error) {
            console.error("Error fetching orders:", error);
            container.innerHTML = "<p>Error loading orders.</p>";
        }
    }

    // ======================
    // ADMIN DASHBOARD
    // ======================
    async initAdminDashboard() {
        console.log("Checking Admin Access for:", this.user ? this.user.email : "Guest");
        const isAdmin = this.user && (this.user.email === 'admin@varmagallery.com' || this.user.email === 'admin@elegance.com');
        console.log("Is Admin Passing:", isAdmin);

        const container = document.getElementById("main-content");
        if (!container) return;

        if (!isAdmin) {
            container.innerHTML = `
                <section class="container section-padding" style="padding-top: 120px; text-align: center; min-height: 60vh;">
                    <h1 class="section-title">Access Denied</h1>
                    <p style="color: var(--text-muted); margin-bottom: var(--space-lg);">You do not have permission to view this page. Please log in with an administrator account.</p>
                    <button class="btn btn-primary" data-link="home">Back to Home</button>
                </section>
            `;
            return;
        }

        // Re-render admin page skeleton if we are here (to ensure tabs exist)
        container.innerHTML = pages.admin();
        this.switchAdminTab(this.activeAdminTab);
        
        const ordersContainer = document.getElementById("admin-orders-container");
        if (!ordersContainer) return;

        try {
            const querySnapshot = await getDocs(collection(db, "orders"));

            if (querySnapshot.empty) {
                ordersContainer.innerHTML = "<p>No orders found in the system.</p>";
            } else {
                const orders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                let html = `
                    <div style="margin-bottom: var(--space-md); display: flex; justify-content: space-between;">
                        <input type="text" id="admin-search-orders" placeholder="Search by Email or Order ID..." style="padding: 10px; border: 1px solid var(--border-color); width: 300px; border-radius: 4px;">
                    </div>
                    <table style="width: 100%; border-collapse: collapse; text-align: left;">
                        <thead>
                            <tr style="background: #f4f4f4; border-bottom: 2px solid #ddd;">
                                <th style="padding: 10px;">Date</th>
                                <th style="padding: 10px;">Email</th>
                                <th style="padding: 10px;">Order ID</th>
                                <th style="padding: 10px;">Total</th>
                                <th style="padding: 10px;">Status</th>
                                <th style="padding: 10px;">Action</th>
                            </tr>
                        </thead>
                        <tbody id="admin-orders-tbody">
                `;

                const renderTableRows = (data) => {
                    let rowsHtml = '';
                    data.forEach(order => {
                        rowsHtml += `
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 10px;">${order.createdAt ? (order.createdAt.toDate ? order.createdAt.toDate().toLocaleDateString() : new Date(order.createdAt).toLocaleDateString()) : 'N/A'}</td>
                                <td style="padding: 10px;">${order.customerName || order.email || 'N/A'}</td>
                                <td style="padding: 10px; font-size: 0.8rem;">${order.id}</td>
                                <td style="padding: 10px;">$${(order.totalAmount || 0).toLocaleString()}</td>
                                <td style="padding: 10px;"><strong>${order.status || 'Processing'}</strong></td>
                                <td style="padding: 10px; display: flex; gap: 5px; align-items: center;">
                                    <button onclick='window.appInstance.viewOrderDetails(${JSON.stringify(order).replace(/'/g, "&apos;")})' class="btn" style="padding: 5px 10px; font-size: 0.75rem;">View</button>
                                    <select onchange="window.updateOrderStatus('${order.id}', this.value)" style="padding: 5px; border-radius: 4px; border: 1px solid #ddd; font-size: 0.75rem;">
                                        <option value="Processing" ${order.status === 'Processing' || !order.status ? 'selected' : ''}>Processing</option>
                                        <option value="Packed" ${order.status === 'Packed' ? 'selected' : ''}>Packed</option>
                                        <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                                        <option value="Out for Delivery" ${order.status === 'Out for Delivery' ? 'selected' : ''}>Out for Delivery</option>
                                        <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                                    </select>
                                </td>
                            </tr>
                        `;
                    });
                    return rowsHtml;
                };

                html += renderTableRows(orders);
                html += `</tbody></table>`;
                ordersContainer.innerHTML = html;

                const searchInput = document.getElementById('admin-search-orders');
                if (searchInput) {
                    searchInput.addEventListener('input', (e) => {
                        const term = e.target.value.toLowerCase();
                        const filteredOrders = orders.filter(o => 
                            (o.email && o.email.toLowerCase().includes(term)) || 
                            o.id.toLowerCase().includes(term)
                        );
                        document.getElementById('admin-orders-tbody').innerHTML = renderTableRows(filteredOrders);
                    });
                }
            }
        } catch (error) {
            console.error("🔥 Firestore Order Fetch Failed:", error);
            if (ordersContainer) {
                ordersContainer.innerHTML = `
                    <div style="background: #fff5f5; border: 1px solid #feb2b2; color: #c53030; padding: 1.5rem; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-bottom: 10px;">Failed to Load Orders</h3>
                        <p><strong>Firebase Error Code:</strong> <span style="font-family: monospace;">${error.code || 'unknown'}</span></p>
                        <p style="margin-top: 10px;">${error.message}</p>
                        <hr style="margin: 15px 0; border: 0; border-top: 1px solid #feb2b2;">
                        <p style="font-size: 0.9rem;"><strong>Troubleshooting:</strong> Ensure your email (<strong>${this.user ? this.user.email : 'N/A'}</strong>) is correctly configured in your Firestore Security Rules as an administrator.</p>
                    </div>
                `;
            }
        }

        window.updateOrderStatus = async (orderId, newStatus) => {
            try {
                await updateDoc(doc(db, "orders", orderId), { status: newStatus });
                this.showToast("Order status updated successfully!", "success");
                this.initAdminDashboard(); // Refresh
            } catch (e) {
                console.error("Error updating status:", e);
                alert("Failed to update status.");
            }
        };

        this.viewOrderDetails = (order) => {
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.style.display = 'flex';
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.background = 'rgba(0,0,0,0.7)';
            modal.style.zIndex = '2000';
            modal.style.justifyContent = 'center';
            modal.style.alignItems = 'center';

            const addr = order.deliveryAddress || {};
            const itemsHtml = (order.items || []).map(i => `
                <div style="border-bottom: 1px solid #eee; padding: 10px 0; display: flex; justify-content: space-between;">
                    <div>
                        <strong>${i.title}</strong><br>
                        <small>Size: ${i.size} | Frame: ${i.frame} | Qty: ${i.quantity}</small>
                    </div>
                    <span>$${(i.subtotal || 0).toLocaleString()}</span>
                </div>
            `).join('');

            modal.innerHTML = `
                <div class="modal-content" style="background: white; padding: 30px; border-radius: 8px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; position: relative;">
                    <span onclick="this.parentElement.parentElement.remove()" style="position: absolute; top: 15px; right: 20px; cursor: pointer; font-size: 1.5rem;">&times;</span>
                    <h2 style="margin-bottom: 20px; border-bottom: 2px solid var(--accent-color); padding-bottom: 10px;">Order Details</h2>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
                        <div>
                            <h4 style="color: var(--text-muted); margin-bottom: 5px; font-size: 0.8rem; text-transform: uppercase;">Customer</h4>
                            <p><strong>${order.customerName}</strong></p>
                            <p>${order.email}</p>
                            <p>${order.phoneNumber}</p>
                        </div>
                        <div>
                            <h4 style="color: var(--text-muted); margin-bottom: 5px; font-size: 0.8rem; text-transform: uppercase;">Shipping Address</h4>
                            <p>${addr.street || 'N/A'}</p>
                            <p>${addr.city || ''}, ${addr.state || ''} ${addr.pincode || ''}</p>
                        </div>
                    </div>

                    <div style="margin-bottom: 25px;">
                        <h4 style="color: var(--text-muted); margin-bottom: 10px; font-size: 0.8rem; text-transform: uppercase;">Delivery Instructions</h4>
                        <p style="background: #f9f9f9; padding: 10px; border-radius: 4px; font-style: italic;">${order.deliveryInstructions || 'No instructions provided.'}</p>
                    </div>

                    <div style="margin-bottom: 25px;">
                        <h4 style="color: var(--text-muted); margin-bottom: 10px; font-size: 0.8rem; text-transform: uppercase;">Items</h4>
                        ${itemsHtml}
                    </div>

                    <div style="background: #f0f2f2; padding: 20px; border-radius: 4px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>Subtotal</span>
                            <span>$${(order.priceSummary?.subtotal || 0).toLocaleString()}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #c45500;">
                            <span>Discount</span>
                            <span>-$${(order.priceSummary?.discount || 0).toLocaleString()}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 10px;">
                            <span>Delivery</span>
                            <span>Free</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.2rem;">
                            <span>Total Amount</span>
                            <span style="color: var(--accent-color);">$${(order.totalAmount || 0).toLocaleString()}</span>
                        </div>
                        <div style="margin-top: 15px; font-size: 0.85rem; color: var(--text-muted);">
                            <span>Method: ${order.paymentDetails?.paymentMethod?.toUpperCase()} | Status: ${order.paymentDetails?.paymentStatus}</span>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        };
    }

    // ======================
    // TRACK ORDER PAGE
    // ======================
    initTrackOrder(orderId) {
        const container = document.getElementById("track-order-container");
        if (!container || !orderId) return;

        // Unsubscribe from previous listener if exists
        if (this.trackUnsubscribe) {
            this.trackUnsubscribe();
        }

        this.trackUnsubscribe = onSnapshot(doc(db, "orders", orderId), (docSnapshot) => {
            if (!docSnapshot.exists()) {
                container.innerHTML = "<p style='color:red;'>Order not found.</p>";
                return;
            }

            const order = docSnapshot.data();
            const status = order.status || "Order Placed";

            const stages = ["Order Placed", "Packed", "Shipped", "Out for Delivery", "Delivered"];
            const stageIcons = {
                "Order Placed": "📝",
                "Packed": "📦",
                "Shipped": "🚚",
                "Out for Delivery": "🛵",
                "Delivered": "🏠"
            };

            const currentIndex = stages.indexOf(status) === -1 ? 0 : stages.indexOf(status);
            
            // Calculate progress percentage
            const progressPercent = (currentIndex / (stages.length - 1)) * 100;

            let stepsHtml = stages.map((stage, index) => {
                let stateClass = "pending";
                if (index < currentIndex) stateClass = "completed";
                else if (index === currentIndex) stateClass = "active";
                if (status === "Delivered") stateClass = "completed";

                return `
                    <div class="tracking-step ${stateClass}">
                        <div class="tracking-icon">${stageIcons[stage]}</div>
                        <div class="tracking-label">${stage}</div>
                    </div>
                `;
            }).join('');

            const estDate = new Date(order.createdAt);
            estDate.setDate(estDate.getDate() + 7); 

            container.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg);">
                    <h3>Order: ${orderId}</h3>
                    <p>Status: <strong style="color: var(--accent-color);">${status}</strong></p>
                </div>
                
                <div class="tracking-container">
                    <div class="tracking-line-bg"></div>
                    <div class="tracking-line-progress" style="width: calc((100% - 100px) * ${currentIndex} / ${stages.length - 1});"></div>
                    ${stepsHtml}
                </div>

                <div style="margin-top: var(--space-xl); border-top: 1px solid #eee; padding-top: var(--space-md); display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <p style="color: var(--text-muted); font-size: 0.9rem;">Shipping to</p>
                        <p><strong>${order.email}</strong></p>
                    </div>
                    <div style="text-align: right;">
                        <p style="color: var(--text-muted); font-size: 0.9rem;">Estimated Delivery</p>
                        <p><strong>${estDate.toLocaleDateString()}</strong></p>
                    </div>
                </div>
            `;
        }, (error) => {
            console.error("Tracking listener error:", error);
            container.innerHTML = "<p>Error loading tracking data.</p>";
        });
    }

    // ======================
    // PDF INVOICE
    // ======================
    downloadInvoice() {
        const element = document.getElementById("order-details-container");
        if (!element) return;

        const opt = {
            margin: 1,
            filename: 'Invoice_VarmaGallery.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        if (window.html2pdf) {
            window.html2pdf().set(opt).from(element).save();
        } else {
            alert("PDF generation library is loading, please try again in a moment.");
        }
    }

    // ======================
    // ADMIN DASHBOARD TABS
    // ======================
    switchAdminTab(tabName) {
        this.activeAdminTab = tabName;
        document.getElementById("admin-tab-orders").style.display = "none";
        document.getElementById("admin-tab-products").style.display = "none";
        document.getElementById("admin-tab-analytics").style.display = "none";
        document.getElementById("admin-tab-coupons").style.display = "none";
        document.getElementById("admin-tab-frames").style.display = "none";

        document.getElementById("tab-btn-orders").classList.remove("btn-primary");
        document.getElementById("tab-btn-products").classList.remove("btn-primary");
        document.getElementById("tab-btn-analytics").classList.remove("btn-primary");
        document.getElementById("tab-btn-coupons").classList.remove("btn-primary");

        document.getElementById("tab-btn-orders").style.background = "transparent";
        document.getElementById("tab-btn-products").style.background = "transparent";
        document.getElementById("tab-btn-analytics").style.background = "transparent";
        document.getElementById("tab-btn-coupons").style.background = "transparent";
        document.getElementById("tab-btn-frames").style.background = "transparent";
        
        document.getElementById("tab-btn-orders").style.color = "var(--text-color)";
        document.getElementById("tab-btn-products").style.color = "var(--text-color)";
        document.getElementById("tab-btn-analytics").style.color = "var(--text-color)";
        document.getElementById("tab-btn-coupons").style.color = "var(--text-color)";
        document.getElementById("tab-btn-frames").style.color = "var(--text-color)";

        document.getElementById(`admin-tab-${tabName}`).style.display = "block";
        document.getElementById(`tab-btn-${tabName}`).classList.add("btn-primary");
        document.getElementById(`tab-btn-${tabName}`).style.background = "var(--accent-color)";
        document.getElementById(`tab-btn-${tabName}`).style.color = "var(--white)";

        if (tabName === 'analytics') {
            this.initAdminAnalytics();
        }
        if (tabName === 'products') this.fetchAdminProducts();
        if (tabName === 'coupons') this.fetchCoupons();
        if (tabName === 'frames') this.fetchAdminFrames();
    }

    // ======================
    // ADMIN DASHBOARD - ANALYTICS & PRODUCTS
    // ======================
    async initAdminAnalytics(force = false) {
        // Prevent refreshing if we already have data and not forced
        if (this.analyticsData && !force && window.revChart) {
            return;
        }

        try {
            console.log("📊 Fetching Analytics Data...");
            const ordersSnap = await getDocs(collection(db, "orders"));
            const orders = ordersSnap.docs.map(doc => doc.data());
            
            // Basic hash to check for changes
            const dataHash = JSON.stringify(orders.map(o => o.status + o.totalAmount));
            if (this.analyticsData === dataHash && !force) return;
            this.analyticsData = dataHash;

            let totalRevenue = 0;
            const dailyRevenue = {};
            const categorySales = {};
            const productSales = {};
            const orderStatusCount = {};

            orders.forEach(order => {
                const amount = order.totalAmount || 0;
                totalRevenue += amount;

                // Date logic
                const date = new Date(order.createdAt).toLocaleDateString();
                dailyRevenue[date] = (dailyRevenue[date] || 0) + amount;

                // Status logic
                const status = order.status || "Order Placed";
                orderStatusCount[status] = (orderStatusCount[status] || 0) + 1;

                // Product & Category logic (if available in order items)
                if (order.items) {
                    order.items.forEach(item => {
                        productSales[item.title] = (productSales[item.title] || 0) + 1;
                        
                        // Try to find category from artworks array
                        const art = artworks.find(a => a.id === item.id);
                        const category = art ? art.category : "Unknown";
                        categorySales[category] = (categorySales[category] || 0) + 1;
                    });
                }
            });

            // Update Stats
            document.getElementById('analytics-revenue').innerText = `$${totalRevenue.toLocaleString()}`;
            document.getElementById('analytics-orders').innerText = orders.length;
            document.getElementById('analytics-aov').innerText = `$${orders.length ? Math.round(totalRevenue / orders.length).toLocaleString() : 0}`;

            // 1. Revenue Line Chart
            this.renderRevenueChart(dailyRevenue);

            // 2. Category Pie Chart
            this.renderCategoryChart(categorySales);

            // 3. Top Products List
            this.renderTopProducts(productSales);

            // 4. Status Doughnut Chart
            this.renderStatusChart(orderStatusCount);

        } catch (err) {
            console.error("Analytics Error:", err);
        }
    }

    renderRevenueChart(data) {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;

        // Destroy previous chart if exists
        if (window.revChart) window.revChart.destroy();

        window.revChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Object.keys(data),
                datasets: [{
                    label: 'Daily Revenue ($)',
                    data: Object.values(data),
                    borderColor: '#D4AF37',
                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    renderCategoryChart(data) {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;
        if (window.catChart) window.catChart.destroy();

        window.catChart = new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels: Object.keys(data),
                datasets: [{
                    data: Object.values(data),
                    backgroundColor: ['#D4AF37', '#1A1A1A', '#5A5A5A', '#EAEAEA', '#4CAF50']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    renderStatusChart(data) {
        const ctx = document.getElementById('statusChart');
        if (!ctx) return;
        if (window.statChart) window.statChart.destroy();

        window.statChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(data),
                datasets: [{
                    data: Object.values(data),
                    backgroundColor: ['#4CAF50', '#D4AF37', '#2196F3', '#FF9800', '#F44336']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    renderTopProducts(data) {
        const container = document.getElementById('top-products-list');
        if (!container) return;

        const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 5);
        
        container.innerHTML = sorted.map(([title, count], i) => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #eee;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-weight: 700; color: var(--accent-color);">#${i+1}</span>
                    <span>${title}</span>
                </div>
                <span style="background: #f0f0f0; padding: 2px 8px; border-radius: 10px; font-size: 0.8rem;">${count} Sold</span>
            </div>
        `).join('') || '<p style="color: var(--text-muted); text-align: center;">No sales data available.</p>';
    }

    fetchAdminProducts() {
        const container = document.getElementById("admin-products-container");
        if (!container) return;

        let html = `
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead>
                    <tr style="background: #f4f4f4; border-bottom: 2px solid #ddd;">
                        <th style="padding: 10px;">Image</th>
                        <th style="padding: 10px;">Title</th>
                        <th style="padding: 10px;">Price</th>
                        <th style="padding: 10px;">Category</th>
                        <th style="padding: 10px;">Action</th>
                    </tr>
                </thead>
                <tbody>
        `;

        if (artworks.length === 0) {
            html += `<tr><td colspan="5" style="padding: 20px; text-align: center; color: var(--text-muted);">No products found in the gallery.</td></tr>`;
        } else {
            artworks.forEach(prod => {
                const isHighlighted = window.lastEditedId === prod.id;
                html += `
                    <tr style="border-bottom: 1px solid #ddd; transition: background 1s; background: ${isHighlighted ? '#fff9db' : 'transparent'};">
                        <td style="padding: 10px;"><img src="${prod.image}" width="50" style="border-radius: 5px; height: 50px; object-fit: cover;"></td>
                        <td style="padding: 10px;">${prod.title}</td>
                        <td style="padding: 10px;">$${this.getFinalPrice(prod.price).toLocaleString()}</td>
                        <td style="padding: 10px;">${prod.category}</td>
                        <td style="padding: 10px;">
                            <button class="btn" style="padding: 5px 10px; background: #007185; color: white; border-radius: 4px; margin-right: 5px;" onclick="window.appInstance.editProduct('${prod.id}')">Edit</button>
                            <button class="btn" style="padding: 5px 10px; background: #ff4d4d; color: white; border-radius: 4px;" onclick="window.appInstance.deleteProduct('${prod.id}')">Delete</button>
                        </td>
                    </tr>
                `;
            });
        }

        html += `</tbody></table>`;
        container.innerHTML = html;

        // Attach form listener
        const form = document.getElementById("add-product-form");
        if (!form) return;
            
            form.onsubmit = async (e) => {
                e.preventDefault();
                const submitBtn = document.getElementById('prod-submit-btn');
                const isEditing = !!window.editingProductId;
                
                submitBtn.innerText = isEditing ? "Updating..." : "Uploading...";
                submitBtn.disabled = true;

                try {
                    const primaryImageUrl = document.getElementById('prod-primary-image-url').value;
                    if (!primaryImageUrl && !isEditing) {
                        alert("Please upload and crop a primary image.");
                        submitBtn.disabled = false;
                        submitBtn.innerText = isEditing ? "Update Product" : "Save Product";
                        return;
                    }
                    
                    const media = [];
                    if (primaryImageUrl) {
                        media.push({ type: 'image', url: primaryImageUrl });
                    } else if (isEditing) {
                        // Fallback to existing image if not uploading a new one during edit
                        const existingProduct = artworks.find(a => a.id === window.editingProductId);
                        if (existingProduct) {
                            media.push({ type: 'image', url: existingProduct.image });
                        }
                    }

                    // Handle Variants
                    let variants = window.appInstance.getVariantsFromRows();
                    if (!variants) {
                        const { DEFAULT_VARIANTS } = await import('./products.js');
                        variants = [...DEFAULT_VARIANTS];
                    }

                    const productData = {
                        title: document.getElementById('prod-title').value,
                        artist: document.getElementById('prod-artist').value,
                        price: variants && variants.length > 0 ? variants[0].price : Number(document.getElementById('prod-price').value),
                        category: document.getElementById('prod-category').value,
                        dimensions: document.getElementById('prod-dimensions').value,
                        media: media, 
                        image: media[0].url, 
                        stock: Number(document.getElementById('prod-stock').value),
                        variants: variants,
                        featured: document.getElementById('prod-featured').checked,
                        updatedAt: new Date().toISOString()
                    };

                    if (isEditing) {
                        window.lastEditedId = window.editingProductId;
                        await updateDoc(doc(db, "products", window.editingProductId), productData);
                        console.log("✅ Product updated in Firestore:", productData);
                        alert("Product updated successfully!");
                        setTimeout(() => { window.lastEditedId = null; this.fetchAdminProducts(); }, 3000);
                    } else {
                        productData.createdAt = new Date().toISOString();
                        await addDoc(collection(db, "products"), productData);
                        console.log("✅ Product added to Firestore:", productData);
                        alert("Product added successfully!");
                    }
                    
                    this.resetProductForm();
                } catch (err) {
                    console.error("❌ Firestore Save Error:", err);
                    alert("Failed to save product: " + err.message);
                } finally {
                    submitBtn.innerText = isEditing ? "Update Product" : "Save Product";
                    submitBtn.disabled = false;
                }
            };
    }

    editProduct(id) {
        const art = artworks.find(a => a.id === id);
        if (!art) return;

        window.editingProductId = id;
        
        // Update Modal UI
        const modal = document.getElementById('add-product-modal');
        const title = modal.querySelector('h2');
        const submitBtn = document.getElementById('prod-submit-btn');
        
        title.innerText = "Edit Product";
        submitBtn.innerText = "Update Product";

        // Pre-fill fields
        document.getElementById('prod-title').value = art.title || '';
        document.getElementById('prod-artist').value = art.artist || '';
        document.getElementById('prod-price').value = art.price || 0;
        document.getElementById('prod-category').value = art.category || '';
        document.getElementById('prod-dimensions').value = art.dimensions || '';
        document.getElementById('prod-stock').value = art.stock || 0;
        document.getElementById('prod-featured').checked = !!art.featured;
        // Pre-fill variants
        const variantsContainer = document.getElementById('variant-rows-container');
        if (variantsContainer) variantsContainer.innerHTML = '';
        if (art.variants && art.variants.length > 0) {
            art.variants.forEach(v => {
                this.addVariantRow(v.size, v.price, v.stock);
            });
        }

        modal.style.display = 'flex';
    }

    resetProductForm(closeModal = true) {
        const modal = document.getElementById('add-product-modal');
        const form = document.getElementById("add-product-form");
        if (!modal) return;
        
        const title = modal.querySelector('h2');
        const submitBtn = document.getElementById('prod-submit-btn');

        window.editingProductId = null;
        if (title) title.innerText = "Add New Product";
        if (submitBtn) submitBtn.innerText = "Save Product";
        
        const cropperWrapper = document.getElementById("cropper-wrapper");
        const cropBtn = document.getElementById("crop-btn");
        const primaryImgUrl = document.getElementById("prod-primary-image-url");
        if (cropperWrapper) cropperWrapper.style.display = 'none';
        if (cropBtn) cropBtn.style.display = 'none';
        if (primaryImgUrl) primaryImgUrl.value = '';
        
        const variantsContainer = document.getElementById('variant-rows-container');
        if (variantsContainer) variantsContainer.innerHTML = '';
        
        if (this.cropper) {
            this.cropper.destroy();
            this.cropper = null;
        }

        if (form) form.reset();
        if (closeModal) modal.style.display = 'none';
    }

    // ======================
    // NOTIFICATIONS
    // ======================
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = '🔔';
        if (type === 'success') icon = '✅';
        if (type === 'error') icon = '❌';
        
        toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
        container.appendChild(toast);

        // Remove after animation
        setTimeout(() => toast.remove(), 3500);
    }

    // ======================
    // RECOMMENDATIONS
    // ======================
    getRecommendations(category, currentId) {
        // Logic: Same category, not the same product, or from wishlist
        let pool = artworks.filter(a => a.id !== currentId);
        
        if (category) {
            const filtered = pool.filter(a => a.category === category);
            if (filtered.length >= 4) return filtered.slice(0, 4);
            pool = [...filtered, ...pool.filter(a => a.category !== category)];
        }
        
        return pool.slice(0, 4);
    }

    // ======================
    // LOCALIZATION & CURRENCY
    // ======================
    t(key) {
        return this.translations[this.language][key] || key;
    }

    getFinalPrice(price) {
        return price * 2;
    }

    convertPrice(price) {
        // Source of truth is now INR (₹250 in DB = ₹250 on screen)
        if (this.currency === 'USD') return price / 83;
        return price;
    }

    formatPrice(price) {
        return new Intl.NumberFormat(this.currency === 'INR' ? 'en-IN' : 'en-US', {
            style: 'currency',
            currency: this.currency || 'INR',
            maximumFractionDigits: 0
        }).format(price);
    }

    setCurrency(cur) {
        this.currency = cur;
        localStorage.setItem('currency', cur);
        this.render();
    }

    setLanguage(lang) {
        this.language = lang;
        localStorage.setItem('language', lang);
        this.render();
    }

    // ======================
    // ACTIONS
    // ======================
    selectFrame(type) {
        const masterWrapper = document.getElementById('frame-master-wrapper');
        const innerContainer = document.getElementById('artwork-inner-container');
        if (!masterWrapper || !innerContainer) return;

        if (this.currentRoute === 'product' && this.currentParam) {
            localStorage.setItem(`frame_${this.currentParam}`, type);
        }

        const artworkImg = document.querySelector('.zoom-image');
        const applyRatio = () => {
            if (artworkImg && type !== 'none') {
                const ratio = artworkImg.naturalWidth / artworkImg.naturalHeight;
                if (ratio) {
                    masterWrapper.style.aspectRatio = ratio.toString();
                    masterWrapper.style.width = 'auto';
                    masterWrapper.style.height = '500px';
                }
            } else {
                masterWrapper.style.aspectRatio = '';
                masterWrapper.style.width = '100%';
                masterWrapper.style.height = '500px';
            }
        };

        if (type === 'none') {
            applyRatio();
            masterWrapper.style.backgroundImage = 'none';
            masterWrapper.style.padding = '0';
            innerContainer.style.top = '0';
            innerContainer.style.left = '0';
            innerContainer.style.width = '100%';
            innerContainer.style.height = '100%';
            masterWrapper.classList.remove('has-frame');
        } else {
            applyRatio();
            if (artworkImg && !artworkImg.complete) {
                artworkImg.onload = applyRatio;
            }
            masterWrapper.classList.add('has-frame');
            
            // Support both dynamic frames from Firestore and legacy local frames
            const frameObj = this.frames.find(f => f.id === type);
            const frameUrl = frameObj ? frameObj.url : `images/frame-${type}.png`;
            masterWrapper.style.backgroundImage = `url('${frameUrl}')`;
            
            // Standard 12% padding for all frames
            innerContainer.style.top = '12%';
            innerContainer.style.left = '12%';
            innerContainer.style.width = '76%';
            innerContainer.style.height = '76%';
            innerContainer.style.position = 'absolute';
        }

        // Highlight active frame card
        document.querySelectorAll('.frame-card').forEach(card => {
            if (card.dataset.frame === type) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
    }

    toggleWallView() {
        const zoomContainer = document.querySelector('.zoom-container');
        const toggleBtn = document.getElementById('wall-view-toggle');
        if (!zoomContainer || !toggleBtn) return;

        zoomContainer.classList.toggle('wall-active');
        toggleBtn.classList.toggle('active');
        
        if (zoomContainer.classList.contains('wall-active')) {
            toggleBtn.innerHTML = '<span class="icon">🖼️</span><span>Standard View</span>';
        } else {
            toggleBtn.innerHTML = '<span class="icon">🏠</span><span>View on Wall</span>';
        }
    }

    addToCart(id, frame = null, size = null, price = null) {
        const art = artworks.find(a => String(a.id) === String(id));
        if (!art) return;

        // Use provided size/price (from selection) or fallback to the first variant (Requirement 1 & 4)
        const selected = this.selectedVariants[id];
        const finalSize = size || (selected ? selected.size : (art.variants ? art.variants[0].size : 'Standard'));
        const finalPrice = price || (selected ? selected.price : (art.variants ? art.variants[0].price : art.price));
        const doubledPrice = this.getFinalPrice(finalPrice);
        
        const variant = art.variants ? art.variants.find(v => v.size === finalSize) : null;
        const finalStock = variant ? variant.stock : (art.stock || 0);

        if (finalStock <= 0) {
            this.showToast("Sorry, this item is out of stock.", "error");
            return;
        }

        // Store selected size and price in the cart item (Requirement 4)
        const cartItem = { 
            ...art, 
            price: doubledPrice,
            selectedSize: finalSize,
            selectedPrice: doubledPrice
        };
        
        // Get currently selected frame from localStorage or fallback
        const selectedFrame = frame || localStorage.getItem(`frame_${id}`) || 'none';
        
        cart.addItem(cartItem, finalSize, selectedFrame);
        this.showToast(`"${art.title}" (${finalSize}) added to cart with ${selectedFrame} frame!`, "success");
        this.render();
    }

    selectSize(size, price, stock, el) {
        if (!window.currentProduct) return;
        const productId = window.currentProduct.id;
        
        // Store in app state
        this.selectedVariants[productId] = { size, price, stock };

        // Update UI Price
        const priceDisplay = document.getElementById('product-price-display');
        if (priceDisplay) {
            priceDisplay.innerText = this.formatPrice(this.convertPrice(this.getFinalPrice(price)));
        }

        // Update Active Button
        document.querySelectorAll('.size-opt').forEach(btn => {
            btn.style.background = 'transparent';
            btn.style.color = 'var(--text-color)';
            btn.classList.remove('active');
        });
        el.style.background = 'var(--text-color)';
        el.style.color = 'var(--white)';
        el.classList.add('active');

        // Update Stock Status for Add to Cart button
        const btn = document.getElementById('add-to-cart-btn');
        const text = document.getElementById('cart-btn-text');
        if (btn && text) {
            if (stock === 0) {
                btn.disabled = true;
                btn.style.background = '#ccc';
                btn.style.cursor = 'not-allowed';
                text.innerText = this.t('outOfStock');
            } else {
                btn.disabled = false;
                btn.style.background = 'var(--text-color)';
                btn.style.cursor = 'pointer';
                text.innerText = this.t('addToCart');
            }
        }
    }

    getStartingPrice(art) {
        if (!art.variants || art.variants.length === 0) return art.price || 0;
        return Math.min(...art.variants.map(v => v.price));
    }

    getRecommendations() {
        const featured = artworks.filter(art => art.featured === true).slice(0, 6);
        const featuredIds = featured.map(a => a.id);
        return artworks.filter(a => !featuredIds.includes(a.id)).slice(0, 4);
    }

    getRatingData(id) {
        const artReviews = reviews.filter(r => String(r.productId) === String(id));
        if (artReviews.length === 0) return { avg: 0, count: 0 };
        const sum = artReviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
        return { avg: sum / artReviews.length, count: artReviews.length };
    }

    showToast(msg, type = 'success') {
        if (typeof Toast !== 'undefined' && Toast.show) {
            Toast.show(msg, type);
        } else {
            console.log(`Toast (${type}): ${msg}`);
            alert(msg);
        }
    }

    // ======================
    // COUPONS
    // ======================
    async addCoupon(form) {
        const formData = new FormData(form);
        const coupon = {
            code: formData.get('code').toUpperCase(),
            type: formData.get('type'),
            value: Number(formData.get('value')),
            expiry: formData.get('expiry'),
            createdAt: new Date().toISOString()
        };

        try {
            await addDoc(collection(db, "coupons"), coupon);
            alert("Coupon created successfully!");
            this.fetchCoupons();
        } catch (err) {
            alert("Error creating coupon.");
        }
    }

    async fetchCoupons() {
        const container = document.getElementById("admin-coupons-container");
        if (!container) return;

        try {
            const snap = await getDocs(collection(db, "coupons"));
            let html = `
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <thead style="background: #f8f8f8;">
                        <tr>
                            <th style="padding: 10px; text-align: left;">Code</th>
                            <th style="padding: 10px; text-align: left;">Type</th>
                            <th style="padding: 10px; text-align: left;">Value</th>
                            <th style="padding: 10px; text-align: left;">Expiry</th>
                            <th style="padding: 10px; text-align: left;">Action</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            if (snap.empty) {
                html += `<tr><td colspan="5" style="padding: 20px; text-align: center; color: var(--text-muted);">No coupons found.</td></tr>`;
            } else {
                snap.forEach(docSnap => {
                    const c = docSnap.data();
                    html += `
                        <tr style="border-bottom: 1px solid #ddd;">
                            <td style="padding: 10px;"><strong>${c.code}</strong></td>
                            <td style="padding: 10px;">${c.type}</td>
                            <td style="padding: 10px;">${c.type === 'percentage' ? c.value + '%' : '$' + c.value}</td>
                            <td style="padding: 10px;">${c.expiry}</td>
                            <td style="padding: 10px;"><button onclick="window.appInstance.deleteCoupon('${docSnap.id}')" style="color: #e74c3c;">Delete</button></td>
                        </tr>
                    `;
                });
            }
            html += `</tbody></table>`;
            container.innerHTML = html;
        } catch (err) {
            container.innerHTML = "<p>Error loading coupons.</p>";
        }
    }

    async deleteCoupon(id) {
        if (!confirm("Delete this coupon?")) return;
        try {
            await deleteDoc(doc(db, "coupons", id));
            this.fetchCoupons();
        } catch (err) {
            alert("Error deleting.");
        }
    }

    // ======================
    // FRAMES MANAGEMENT
    // ======================
    fetchAdminFrames() {
        const container = document.getElementById("admin-frames-container");
        if (!container) return;
        if (this.frames.length === 0) {
            container.innerHTML = "<p>No custom frames uploaded yet.</p>";
            return;
        }
        let html = '';
        this.frames.forEach(frame => {
            html += `
                <div class="admin-frame-card">
                    <img src="${frame.url}" alt="${frame.name}">
                    <h4>${frame.name}</h4>
                    <button class="delete-frame-btn" onclick="window.appInstance.deleteFrame('${frame.id}')" title="Delete Frame">×</button>
                </div>
            `;
        });
        container.innerHTML = html;
    }

    async addFrame(form) {
        const name = form.name.value;
        const file = form.file.files[0];
        if (!name || !file) return;

        const btn = form.querySelector('button');
        btn.innerText = "Uploading...";
        btn.disabled = true;

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `frames/frame_${Date.now()}.${fileExt}`;
            const storageRef = ref(storage, fileName);
            await uploadBytes(storageRef, file);
            const downloadUrl = await getDownloadURL(storageRef);

            await addDoc(collection(db, "frames"), {
                name: name,
                url: downloadUrl,
                createdAt: new Date().toISOString()
            });

            alert("Frame uploaded successfully!");
            this.fetchAdminFrames();
        } catch (e) {
            console.error("Error uploading frame:", e);
            alert("Failed to upload frame.");
        } finally {
            btn.innerText = "Upload Frame";
            btn.disabled = false;
            form.reset();
        }
    }

    async deleteFrame(id) {
        if (!confirm("Delete this frame? This might affect products using it.")) return;
        try {
            await deleteDoc(doc(db, "frames", id));
            this.fetchAdminFrames();
        } catch (e) {
            console.error("Error deleting frame:", e);
            alert("Failed to delete frame.");
        }
    }

    // ======================
    // CROPPER LOGIC
    // ======================
    handleImageSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        const wrapper = document.getElementById("cropper-wrapper");
        const img = document.getElementById("cropper-image");
        const cropBtn = document.getElementById("crop-btn");

        wrapper.style.display = "flex";
        cropBtn.style.display = "inline-block";

        const reader = new FileReader();
        reader.onload = (e) => {
            img.src = e.target.result;
            if (this.cropper) {
                this.cropper.destroy();
            }
            this.cropper = new Cropper(img, {
                viewMode: 1,
                autoCropArea: 1,
            });
        };
        reader.readAsDataURL(file);
    }

    async performCrop() {
        if (!this.cropper) return;
        const btn = document.getElementById("crop-btn");
        btn.innerText = "Cropping & Uploading...";
        btn.disabled = true;

        try {
            const canvas = this.cropper.getCroppedCanvas({
                maxWidth: 2000,
                maxHeight: 2000
            });
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            
            const fileName = `products/cropped_${Date.now()}.jpg`;
            const storageRef = ref(storage, fileName);
            await uploadString(storageRef, dataUrl, 'data_url');
            const downloadUrl = await getDownloadURL(storageRef);
            
            document.getElementById("prod-primary-image-url").value = downloadUrl;
            alert("Image cropped and uploaded successfully!");
            btn.style.display = "none";
            document.getElementById("cropper-wrapper").style.display = "none";
        } catch (e) {
            console.error("Error cropping image:", e);
            alert("Failed to crop image.");
        } finally {
            btn.innerText = "Crop Image";
            btn.disabled = false;
        }
    }

    // ======================
    // DYNAMIC VARIANTS
    // ======================
    addVariantRow(size = '', price = '', stock = '10') {
        const container = document.getElementById("variant-rows-container");
        const row = document.createElement('div');
        row.className = "variant-row";
        row.innerHTML = `
            <input type="text" placeholder="Size (e.g. 12x8)" value="${size}" class="v-size" required>
            <input type="number" placeholder="Price ($)" value="${price}" class="v-price" required>
            <input type="number" placeholder="Stock" value="${stock}" class="v-stock" required>
            <button type="button" class="remove-variant-btn" onclick="window.appInstance.removeVariantRow(this)">×</button>
        `;
        container.appendChild(row);
    }

    removeVariantRow(btn) {
        btn.closest('.variant-row').remove();
    }

    getVariantsFromRows() {
        const container = document.getElementById("variant-rows-container");
        if (!container) return null;
        const rows = container.querySelectorAll('.variant-row');
        if (rows.length === 0) return null;
        
        const variants = [];
        rows.forEach(row => {
            const size = row.querySelector('.v-size').value.trim();
            const price = Number(row.querySelector('.v-price').value);
            const stock = Number(row.querySelector('.v-stock').value);
            if (size) {
                variants.push({ size, price, stock });
            }
        });
        return variants.length > 0 ? variants : null;
    }


    async applyCoupon(code) {
        const msg = document.getElementById('coupon-message');
        const codeClean = code.toUpperCase().trim();
        if (!codeClean) return;

        try {
            const q = query(collection(db, "coupons"), where("code", "==", codeClean));
            const snap = await getDocs(q);

            if (snap.empty) {
                msg.innerHTML = '<span style="color: #e74c3c;">Invalid coupon code.</span>';
                this.resetDiscount();
                return;
            }

            const coupon = snap.docs[0].data();
            const today = new Date().toISOString().split('T')[0];

            if (today > coupon.expiry) {
                msg.innerHTML = '<span style="color: #e74c3c;">Coupon has expired.</span>';
                this.resetDiscount();
                return;
            }

            this.appliedCoupon = coupon;
            msg.innerHTML = `<span style="color: #4CAF50;">Coupon applied: ${coupon.code}</span>`;
            this.updateCheckoutTotals();

        } catch (err) {
            console.error(err);
            msg.innerHTML = '<span style="color: #e74c3c;">Error validating coupon.</span>';
        }
    }

    resetDiscount() {
        this.appliedCoupon = null;
        document.getElementById('discount-row').style.display = 'none';
        this.updateCheckoutTotals();
    }

    updateCheckoutTotals() {
        const subtotal = cart.getSelectedTotalPrice();
        let discount = 0;

        if (this.appliedCoupon) {
            if (this.appliedCoupon.type === 'percentage') {
                discount = (subtotal * this.appliedCoupon.value) / 100;
            } else {
                discount = this.appliedCoupon.value;
            }
        }

        const total = Math.max(0, subtotal - discount);
        
        const discRow = document.getElementById('discount-row');
        const discAmt = document.getElementById('discount-amount');
        const finalTotal = document.getElementById('checkout-final-total');

        if (this.appliedCoupon && discRow && discAmt && finalTotal) {
            discRow.style.display = 'flex';
            discAmt.innerText = `-${this.formatPrice(this.convertPrice(discount))}`;
            finalTotal.innerText = this.formatPrice(this.convertPrice(total));
        } else if (finalTotal) {
            finalTotal.innerText = this.formatPrice(this.convertPrice(total));
        }
    }

    async deleteProduct(id) {
        if (confirm("Are you sure you want to delete this product?")) {
            try {
                await deleteDoc(doc(db, "products", id));
                alert("Product deleted.");
                this.fetchAdminProducts();
                // Real-time listener will auto-refresh the UI
            } catch (e) {
                alert("Failed to delete.");
            }
        }
    }

    // ======================
    // REVIEWS
    // ======================
    getRatingData(productId) {
        const prodReviews = reviews.filter(r => r.productId === productId);
        if (prodReviews.length === 0) return { avg: 0, count: 0 };
        
        const sum = prodReviews.reduce((acc, r) => acc + r.rating, 0);
        return {
            avg: (sum / prodReviews.length).toFixed(1),
            count: prodReviews.length
        };
    }

    async submitReview(productId, rating, comment) {
        if (!this.user) {
            alert("Please log in to leave a review.");
            return;
        }

        const existing = reviews.find(r => r.productId === productId && r.userId === this.user.uid);
        if (existing) {
            alert("You have already reviewed this product. You can edit your existing review.");
            return;
        }

        try {
            const review = {
                productId,
                userId: this.user.uid,
                userName: this.user.displayName || this.user.email.split('@')[0],
                rating: Number(rating),
                comment,
                createdAt: new Date().toISOString()
            };

            await addDoc(collection(db, "reviews"), review);
            alert("Review submitted! Thank you.");
        } catch (err) {
            console.error("Review Error:", err);
            alert("Failed to submit review.");
        }
    }

    async deleteReview(reviewId) {
        if (!confirm("Are you sure you want to delete your review?")) return;
        try {
            await deleteDoc(doc(db, "reviews", reviewId));
            alert("Review deleted.");
        } catch (err) {
            alert("Failed to delete review.");
        }
    }

    async editReview(reviewId) {
        const review = reviews.find(r => r.id === reviewId);
        if (!review) return;

        const newRating = prompt("Update Rating (1-5):", review.rating);
        if (newRating === null) return;
        
        const newComment = prompt("Update Comment:", review.comment);
        if (newComment === null) return;

        try {
            await updateDoc(doc(db, "reviews", reviewId), {
                rating: Number(newRating),
                comment: newComment,
                updatedAt: new Date().toISOString()
            });
            alert("Review updated!");
        } catch (err) {
            alert("Failed to update review.");
        }
    }


    changeMedia(index, artId) {
        const art = artworks.find(a => a.id === artId);
        if (!art) return;

        const media = (art.media && art.media.length > 0) ? art.media : [{ type: 'image', url: art.image }];
        const item = media[index];
        if (!item) return;

        const display = document.getElementById('main-media-display');
        if (!display) return;

        // Fade out
        const oldImg = display.querySelector('.product-image, .zoom-image, video');
        if (oldImg) oldImg.style.opacity = '0';

        setTimeout(() => {
            if (item.type === 'video') {
                display.innerHTML = `<video src="${item.url}" controls autoplay muted class="product-image ${art.needsRotation ? 'rotate-90' : ''}" style="height: 100%; width: 100%; object-fit: contain;"></video>`;
            } else {
                display.innerHTML = `
                    <div class="zoom-container" onclick="window.appInstance.openFullscreen('${item.url}')" style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #fdfdfd;">
                        <div id="frame-master-wrapper" class="artwork-frame-wrapper" style="position: relative; width: 100%; display: flex; align-items: center; justify-content: center; background-size: 100% 100%; background-position: center; transition: all 0.5s ease-in-out;">
                            <div id="artwork-inner-container" style="position: relative; transition: all 0.5s ease-in-out; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                                <img src="${item.url}" alt="${art.title}" class="zoom-image ${art.needsRotation ? 'rotate-90' : ''}" style="max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; box-shadow: 0 4px 15px rgba(0,0,0,0.1); z-index: 1; opacity: 0; transition: opacity 0.3s;">
                            </div>
                        </div>
                        <div class="zoom-hint" style="z-index: 3;">Roll over to zoom | Click for full view</div>
                    </div>
                `;
                if (!('ontouchstart' in window)) {
                    this.initImageZoom();
                }
                // Restore frame choice for new image
                const savedFrame = localStorage.getItem(`frame_${artId}`) || 'none';
                this.selectFrame(savedFrame);
            }

            // Fade in
            setTimeout(() => {
                const newImg = display.querySelector('.product-image, .zoom-image, video');
                if (newImg) newImg.style.opacity = '1';
            }, 50);
        }, 300);

        // Update active thumb
        document.querySelectorAll('.thumb').forEach((t, i) => {
            t.style.border = (i === index) ? '2px solid #007185' : '2px solid #ddd';
        });
    }

    initImageZoom() {
        const container = document.querySelector('.zoom-container');
        const img = document.querySelector('.zoom-image');
        if (!container || !img) return;

        container.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            img.style.transformOrigin = `${x}% ${y}%`;
            img.style.transform = "scale(2.5)";
        });

        container.addEventListener('mouseleave', () => {
            img.style.transform = "scale(1)";
            img.style.transformOrigin = "center center";
        });
    }

    openFullscreen(url) {
        const modal = document.getElementById('fullscreen-modal');
        const img = document.getElementById('fullscreen-img');
        if (!modal || !img) return;

        img.src = url;
        modal.style.display = 'flex';
        
        // Reset scale
        img.style.transform = "scale(1)";

        // Simple pinch/scroll zoom simulation
        let scale = 1;
        modal.onwheel = (e) => {
            e.preventDefault();
            scale += e.deltaY * -0.001;
            scale = Math.min(Math.max(.5, scale), 4);
            img.style.transform = `scale(${scale})`;
        };
    }


    // ======================
    // AUTH PAGES
    // ======================
    initLogin() {
        const loginForm = document.getElementById('login-form');
        const openSignup = document.getElementById('open-signup-from-login');

        loginForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                console.log("Logged in:", userCredential.user);
                alert("Login Successful ✅");
                this.navigate('home');
            } catch (error) {
                console.error(error);
                alert("Login Failed: " + error.message);
            }
        });

        openSignup?.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById("authModal").style.display = "flex";
        });
    }

    // ======================
    // FILTERS
    // ======================
    initShopFilters() {
        const searchInput = document.getElementById('shop-search');
        const typeFilter = document.getElementById('filter-type');
        const priceFilter = document.getElementById('filter-price');
        const sortFilter = document.getElementById('sort-by');
        const grid = document.getElementById('shop-grid');

        const updateGrid = () => {
            let filtered = [...artworks];

            // Trending Logic (If we sort by Trending/Featured)
            if (sortFilter?.value === 'featured') {
                filtered = filtered.filter(a => a.featured !== false); // Simple trending logic
            }

            if (searchInput?.value) {
                const term = searchInput.value.toLowerCase();
                filtered = filtered.filter(a => 
                    a.title.toLowerCase().includes(term) || 
                    a.artist.toLowerCase().includes(term)
                );
            }

            if (typeFilter?.value !== 'all') {
                filtered = filtered.filter(a => a.category && a.category.toLowerCase() === typeFilter.value.toLowerCase());
            }

            if (priceFilter?.value === 'under500') {
                filtered = filtered.filter(a => a.price < 500);
            } else if (priceFilter?.value === '500to1000') {
                filtered = filtered.filter(a => a.price >= 500 && a.price <= 1000);
            } else if (priceFilter?.value === 'over1000') {
                filtered = filtered.filter(a => a.price > 1000);
            }

            if (sortFilter?.value === 'price-low') {
                filtered.sort((a, b) => a.price - b.price);
            } else if (sortFilter?.value === 'price-high') {
                filtered.sort((a, b) => b.price - a.price);
            }

            grid.innerHTML = (filtered && filtered.length > 0)
                ? filtered.map(renderProductCard).join('')
                : '<p style="text-align:center;">No artworks found</p>';
        };

        searchInput?.addEventListener('input', updateGrid);
        typeFilter?.addEventListener('change', updateGrid);
        priceFilter?.addEventListener('change', updateGrid);
        sortFilter?.addEventListener('change', updateGrid);

        this.initAutocomplete(searchInput, document.getElementById('search-suggestions'));
    }

    initAutocomplete(input, suggestionsContainer) {
        if (!input || !suggestionsContainer) return;

        const debounce = (func, wait) => {
            let timeout;
            return (...args) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        };

        const highlightText = (text, query) => {
            if (!query) return text;
            const regex = new RegExp(`(${query})`, 'gi');
            return text.replace(regex, '<span class="highlight">$1</span>');
        };

        const handleInput = debounce((e) => {
            const query = e.target.value.toLowerCase().trim();
            if (!query) {
                suggestionsContainer.style.display = 'none';
                return;
            }

            const matches = artworks.filter(a => 
                a.title.toLowerCase().includes(query) || 
                a.artist.toLowerCase().includes(query)
            ).slice(0, 6);

            if (matches && matches.length > 0) {
                suggestionsContainer.innerHTML = matches.map(m => `
                    <div class="suggestion-item" onclick="window.appInstance.navigate('product', '${m.id}')">
                        <div class="suggestion-title">${highlightText(m.title, query)}</div>
                        <div class="suggestion-artist">${highlightText(m.artist, query)}</div>
                    </div>
                `).join('');
                suggestionsContainer.style.display = 'block';
            } else {
                suggestionsContainer.style.display = 'none';
            }
        }, 300);

        input.addEventListener('input', handleInput);

        // Close suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !suggestionsContainer.contains(e.target)) {
                suggestionsContainer.style.display = 'none';
            }
        });
    }

    // ======================
    // WHATSAPP INTEGRATION
    // ======================
    contactWhatsApp(artId) {
        const art = artworks.find(a => String(a.id) === String(artId));
        if (!art) return;

        const phone = "9342954479"; // Updated with user's actual number
        const priceStr = this.formatPrice(this.convertPrice(art.price));
        const message = `Hi, I'm interested in the artwork:
Title: ${art.title}
Artist: ${art.artist}
Price: ${priceStr}
Link: ${window.location.origin}${window.location.pathname}#product/${art.id}`;

        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    }


    // ======================
    // FEATURED SLIDER LOGIC
    // ======================
    initSlider() {
        const track = document.getElementById('slider-track');
        const slides = document.querySelectorAll('.slider-slide');
        const dotsContainer = document.getElementById('slider-dots');
        const btnLeft = document.getElementById('slide-left');
        const btnRight = document.getElementById('slide-right');
        const sliderSection = document.getElementById('featured-slider-section');

        if (!track || slides.length === 0) return;

        // Reset state
        this.sliderIndex = 0;
        clearInterval(this.sliderInterval);

        // Create dots
        dotsContainer.innerHTML = '';
        slides.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.classList.add('slider-dot');
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', () => this.goToSlide(i));
            dotsContainer.appendChild(dot);
        });

        // Add Active Class to First Slide
        slides[0].classList.add('active');

        // Button Events
        btnLeft?.addEventListener('click', () => this.prevSlide());
        btnRight?.addEventListener('click', () => this.nextSlide());

        // Auto Slide
        this.startAutoSlide();

        // Pause on Hover
        sliderSection?.addEventListener('mouseenter', () => clearInterval(this.sliderInterval));
        sliderSection?.addEventListener('mouseleave', () => this.startAutoSlide());
        
        // Touch Support
        let touchStartX = 0;
        sliderSection?.addEventListener('touchstart', (e) => touchStartX = e.touches[0].clientX, {passive: true});
        sliderSection?.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            if (touchStartX - touchEndX > 50) this.nextSlide();
            if (touchEndX - touchStartX > 50) this.prevSlide();
        }, {passive: true});
    }

    startAutoSlide() {
        clearInterval(this.sliderInterval);
        this.sliderInterval = setInterval(() => this.nextSlide(), 4000);
    }

    updateSlider() {
        const track = document.getElementById('slider-track');
        const slides = document.querySelectorAll('.slider-slide');
        const dots = document.querySelectorAll('.slider-dot');

        if (!track) return;

        track.style.transform = `translateX(-${this.sliderIndex * 100}%)`;
        
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === this.sliderIndex);
        });

        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === this.sliderIndex);
        });
    }

    nextSlide() {
        const slides = document.querySelectorAll('.slider-slide');
        if (slides.length === 0) return;
        this.sliderIndex = (this.sliderIndex + 1) % slides.length;
        this.updateSlider();
    }

    prevSlide() {
        const slides = document.querySelectorAll('.slider-slide');
        if (slides.length === 0) return;
        this.sliderIndex = (this.sliderIndex - 1 + slides.length) % slides.length;
        this.updateSlider();
    }

    goToSlide(index) {
        this.sliderIndex = index;
        this.updateSlider();
    }
}

// ======================
// INIT APP
// ======================
document.addEventListener('DOMContentLoaded', () => {
    window.appInstance = new App();
});
