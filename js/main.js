import { pages, renderProductCard } from './pages.js';
import { cart } from './cart.js';
import { wishlist } from './wishlist.js';
import { initProducts, artworks, initReviews, reviews } from './products.js';
import { recent } from './recent.js';

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut }
    from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, setDoc, getDoc, deleteDoc, query, where, getDocs, orderBy, updateDoc, onSnapshot }
    from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL }
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
        this.isProcessingPayment = false;
        
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

        // Close menu on link click
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-link]') && mainNav?.classList.contains('active')) {
                toggleMenu();
            }
        });

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
                cart.addItem(item);
                wishlist.removeItem(id);
            }
        };

        window.payNow = async () => {
            if (this.isProcessingPayment) return;

            if (!this.user) {
                alert("Please log in to proceed with payment.");
                this.navigate('login');
                return;
            }

            const subtotal = cart.getTotalPrice();
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
                name: "Varma Gallery",
                description: "Purchase of Artworks",
                prefill: {
                    name: this.user.displayName || "Art Collector",
                    email: this.user.email,
                    contact: "9999999999" // Dummy contact to allow seamless UPI flow
                },
                theme: {
                    color: "#D4AF37"
                },
                handler: async function (response) {
                    try {
                        const paymentId = response.razorpay_payment_id;
                        const orderData = {
                            items: cart.items,
                            totalAmount: totalAmount,
                            discountApplied: discount,
                            couponCode: window.appInstance.appliedCoupon ? window.appInstance.appliedCoupon.code : null,
                            email: window.appInstance.user.email,
                            paymentId: paymentId,
                            status: "Order Placed",
                            createdAt: new Date().toISOString()
                        };
                        await addDoc(collection(db, "orders"), orderData);

                        // Reduce Stock
                        for (const item of cart.items) {
                            const artRef = doc(db, "products", item.id);
                            const artDoc = artworks.find(a => a.id === item.id);
                            if (artDoc) {
                                await updateDoc(artRef, {
                                    stock: Math.max(0, (artDoc.stock || 1) - item.quantity)
                                });
                            }
                        }

                        await cart.clearCart();
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
                        items: cart.items,
                        totalAmount: totalAmount,
                        discountApplied: discount,
                        couponCode: this.appliedCoupon ? this.appliedCoupon.code : null,
                        email: this.user.email,
                        paymentId: fakePaymentId,
                        status: "Order Placed",
                        createdAt: new Date().toISOString()
                    };
                    addDoc(collection(db, "orders"), orderData)
                        .then(() => cart.clearCart())
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

    // ======================
    // ROUTING
    // ======================
    bindGlobalEvents() {
        document.addEventListener('click', (e) => {
            const linkElement = e.target.closest('[data-link]');
            if (linkElement) {
                e.preventDefault();
                const route = linkElement.getAttribute('data-link');
                const param = linkElement.getAttribute('data-param');
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

        document.getElementById('cartBtn')?.addEventListener('click', () => {
            this.navigate('cart');
        });
    }

    navigate(route, param = null) {
        // Clear slider interval when navigating away from home
        if (this.currentRoute === 'home' && route !== 'home') {
            clearInterval(this.sliderInterval);
        }
        
        this.currentRoute = route;
        this.currentParam = param;
        this.render();
        window.scrollTo(0, 0);

        document.querySelectorAll('.nav-links a').forEach(a => {
            a.classList.remove('active');
            if (a.getAttribute('data-link') === route) {
                a.classList.add('active');
            }
        });
    }

    handleRoute() {
        this.render();
    }

    render() {
        // Toggle header visibility mode based on route
        const header = document.getElementById('header');
        if (this.currentRoute === 'home') {
            this.initSlider();
            header.classList.add('on-hero');
        } else {
            header.classList.remove('on-hero');
            if (this.currentRoute === 'product') {
                window.currentFrame = localStorage.getItem(`frame_${this.currentParam}`) || 'none';
                // Wait for DOM to update then apply frame
                setTimeout(() => this.selectFrame(window.currentFrame), 0);
            }
        }

        const pageRenderer = pages[this.currentRoute] || pages.home;
        this.appElement.innerHTML = pageRenderer(this.currentParam);

        if (this.currentRoute === 'home') {
            this.initSlider();
        }

        if (this.currentRoute === 'product' && this.currentParam) {
            const art = artworks.find(a => String(a.id) === String(this.currentParam));
            if (art) {
                recent.addProduct(art);
                setTimeout(() => this.initImageZoom(), 100);
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
            let itemsHtml = order.items.map(item => `<li>${item.title} x ${item.quantity} ${item.frame && item.frame !== 'none' ? `[${item.frame.charAt(0).toUpperCase() + item.frame.slice(1)} Frame]` : ''} - $${item.price.toLocaleString()}</li>`).join('');

            container.innerHTML = `
                <div style="text-align: left; background: #f9f9f9; padding: var(--space-md); border-radius: 8px;">
                    <p><strong>Order ID:</strong> ${querySnapshot.docs[0].id}</p>
                    <p><strong>Payment ID:</strong> ${order.paymentId}</p>
                    <p><strong>Status:</strong> <span style="color: #D4AF37; font-weight: bold;">${order.status}</span></p>
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
            orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            let html = orders.map(order => `
                <div class="order-card" style="border: 1px solid var(--border-color); padding: var(--space-md); margin-bottom: var(--space-md); border-radius: 5px;">
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px;">
                        <div>
                            <strong>Order ID:</strong> ${order.id}<br>
                            <span style="font-size: 0.8rem; color: gray;">${new Date(order.createdAt).toLocaleString()}</span>
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
                                <td style="padding: 10px;">${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</td>
                                <td style="padding: 10px;">${order.email || 'N/A'}</td>
                                <td style="padding: 10px; font-size: 0.8rem;">${order.id}</td>
                                <td style="padding: 10px;">$${(order.totalAmount || 0).toLocaleString()}</td>
                                <td style="padding: 10px;"><strong>${order.status || 'Processing'}</strong></td>
                                <td style="padding: 10px;">
                                    <select onchange="window.updateOrderStatus('${order.id}', this.value)" style="padding: 5px; border-radius: 4px; border: 1px solid #ddd;">
                                        <option value="Order Placed" ${order.status === 'Order Placed' || !order.status ? 'selected' : ''}>Order Placed</option>
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
                alert("Order status updated successfully!");
                this.initAdminDashboard(); // Refresh
            } catch (e) {
                console.error("Error updating status:", e);
                alert("Failed to update status.");
            }
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

        document.getElementById("tab-btn-orders").classList.remove("btn-primary");
        document.getElementById("tab-btn-products").classList.remove("btn-primary");
        document.getElementById("tab-btn-analytics").classList.remove("btn-primary");
        document.getElementById("tab-btn-coupons").classList.remove("btn-primary");

        document.getElementById("tab-btn-orders").style.background = "transparent";
        document.getElementById("tab-btn-products").style.background = "transparent";
        document.getElementById("tab-btn-analytics").style.background = "transparent";
        document.getElementById("tab-btn-coupons").style.background = "transparent";
        document.getElementById("tab-btn-orders").style.color = "var(--text-color)";
        document.getElementById("tab-btn-products").style.color = "var(--text-color)";
        document.getElementById("tab-btn-analytics").style.color = "var(--text-color)";
        document.getElementById("tab-btn-coupons").style.color = "var(--text-color)";

        document.getElementById(`admin-tab-${tabName}`).style.display = "block";
        document.getElementById(`tab-btn-${tabName}`).classList.add("btn-primary");
        document.getElementById(`tab-btn-${tabName}`).style.background = "var(--accent-color)";
        document.getElementById(`tab-btn-${tabName}`).style.color = "var(--white)";

        if (tabName === 'analytics') {
            this.initAdminAnalytics();
        }
        if (tabName === 'products') this.fetchAdminProducts();
        if (tabName === 'coupons') this.fetchCoupons();
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
                        <td style="padding: 10px;">$${prod.price.toLocaleString()}</td>
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
                    const mediaInputs = document.querySelectorAll('.prod-media');
                    const media = [];
                    mediaInputs.forEach(input => {
                        const url = input.value.trim();
                        if (url) {
                            const isVideo = url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm');
                            media.push({
                                type: isVideo ? 'video' : 'image',
                                url: url
                            });
                        }
                    });

                    if (media.length === 0) {
                        alert("Please provide at least one media URL.");
                        submitBtn.disabled = false;
                        submitBtn.innerText = isEditing ? "Update Product" : "Save Product";
                        return;
                    }

                    const productData = {
                        title: document.getElementById('prod-title').value,
                        artist: document.getElementById('prod-artist').value,
                        price: Number(document.getElementById('prod-price').value),
                        category: document.getElementById('prod-category').value,
                        dimensions: document.getElementById('prod-dimensions').value,
                        media: media, 
                        image: media[0].url, 
                        stock: Number(document.getElementById('prod-stock').value),
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

        // Pre-fill media
        const mediaInputs = document.querySelectorAll('.prod-media');
        mediaInputs.forEach(input => input.value = ''); // Clear first
        
        const mediaUrls = art.media ? art.media.map(m => m.url) : [art.image];
        mediaUrls.forEach((url, i) => {
            if (mediaInputs[i]) mediaInputs[i].value = url;
        });

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

    convertPrice(priceUSD) {
        if (this.currency === 'INR') return priceUSD * 83;
        return priceUSD;
    }

    formatPrice(price) {
        if (this.currency === 'INR') {
            return new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0
            }).format(price);
        }
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
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
    addToCart(id, frame = 'none') {
        const art = artworks.find(a => String(a.id) === String(id));
        if (art && art.stock === 0) {
            this.showToast("Sorry, this item is out of stock.", "error");
            return;
        }
        
        cart.addItem(art, frame);
        this.showToast(`"${art.title}" added to cart!`, "success");
        this.render();
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
        const subtotal = cart.getTotalPrice();
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
                    <div class="zoom-container" onclick="window.appInstance.openFullscreen('${item.url}')">
                        <img src="${item.url}" alt="${art.title}" class="zoom-image ${art.needsRotation ? 'rotate-90' : ''}" style="height: 100%; width: 100%; object-fit: contain; transform: ${art.needsRotation ? 'rotate(90deg)' : 'none'}; opacity: 0; transition: opacity 0.3s;">
                        <div class="zoom-hint">Roll over to zoom | Click for full view</div>
                    </div>
                `;
                this.initImageZoom();
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

            grid.innerHTML = filtered.length
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

            if (matches.length > 0) {
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
        const message = `Hi, I'm interested in the artwork:
Title: ${art.title}
Artist: ${art.artist}
Price: $${art.price.toLocaleString()}
Link: ${window.location.origin}${window.location.pathname}#product/${art.id}`;

        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    }

    // FRAME SELECTION LOGIC
    // ======================
    selectFrame(frameType) {
        const container = document.getElementById('main-media-display');
        if (!container) return;

        // Update UI state
        window.currentFrame = frameType;
        if (this.currentParam) {
            localStorage.setItem(`frame_${this.currentParam}`, frameType);
        }

        // Apply visual frame
        container.classList.remove('frame-none', 'frame-brown', 'frame-gold');
        if (frameType !== 'none') {
            container.classList.add(`frame-${frameType}`);
        }

        // Update active button
        document.querySelectorAll('.frame-opt').forEach(opt => {
            opt.classList.remove('active');
            if (opt.dataset.frame === frameType) {
                opt.classList.add('active');
            }
        });

        console.log(`🖼️ Frame selected: ${frameType}`);
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