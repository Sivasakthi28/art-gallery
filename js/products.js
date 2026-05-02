import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

export const DEFAULT_VARIANTS = [
    { size: "12x8", price: 250, stock: 10 },
    { size: "12x9", price: 300, stock: 10 },
    { size: "15x10", price: 450, stock: 10 },
    { size: "18x12", price: 650, stock: 10 },
    { size: "20x16", price: 1400, stock: 10 },
    { size: "24x20", price: 2000, stock: 10 },
    { size: "30x20", price: 2500, stock: 10 }
];

export const artworks = [];
export const reviews = [];

export const initProducts = (db, onUpdateCallback) => {
    console.log("Initializing products...");
    
    const baseArtworks = [
        { id: "art1", title: "Goddess Lakshmi", artist: "Raja Ravi Varma", price: 1200, category: "Mythological", image: "images/lakshmi.jpg", dimensions: "24 x 36 inches", stock: 5, featured: true, createdAt: new Date().toISOString() },
        { id: "art2", title: "Krishna & Radha", artist: "Raja Ravi Varma", price: 950, category: "Mythological", image: "images/krishna.jpg", dimensions: "20 x 30 inches", stock: 3, featured: true, createdAt: new Date().toISOString() },
        { id: "art3", title: "Rama Darbar", artist: "Raja Ravi Varma", price: 1500, category: "Mythological", image: "images/rama.jpg", dimensions: "30 x 40 inches", stock: 2, featured: true, createdAt: new Date().toISOString() },
        { id: "art4", title: "Shakuntala & Dushyanta", artist: "Raja Ravi Varma", price: 850, category: "Mythological", image: "images/shakuntala.jpg", dimensions: "24 x 36 inches", stock: 4, featured: true, createdAt: new Date().toISOString() },
        { id: "art5", title: "Goddess Saraswati", artist: "Raja Ravi Varma", price: 1100, category: "Mythological", image: "images/saraswati.jpg", dimensions: "24 x 36 inches", stock: 6, featured: true, createdAt: new Date().toISOString() },
        { id: "art6", title: "Goddess Durga", artist: "Raja Ravi Varma", price: 1400, category: "Mythological", image: "images/durga.jpg", dimensions: "24 x 36 inches", stock: 3, featured: true, createdAt: new Date().toISOString() },
        { id: "art7", title: "Vishwamitra & Menaka", artist: "Raja Ravi Varma", price: 900, category: "Mythological", image: "images/vishwamitra.jpg", dimensions: "20 x 30 inches", stock: 2, featured: false, createdAt: new Date().toISOString() },
        { id: "art8", title: "Rama's Coronation", artist: "Raja Ravi Varma", price: 1800, category: "Mythological", image: "images/ram_coronation.jpg", dimensions: "30 x 40 inches", stock: 1, featured: true, createdAt: new Date().toISOString() },
        { id: "art9", title: "Childhood of Rama", artist: "Raja Ravi Varma", price: 750, category: "Mythological", image: "images/child_rama.jpg", dimensions: "18 x 24 inches", stock: 4, featured: false, createdAt: new Date().toISOString() },
        { id: "art10", title: "Lord Rama Portrait", artist: "Raja Ravi Varma", price: 1000, category: "Mythological", image: "images/rama_portrait_new.jpg", dimensions: "24 x 30 inches", stock: 5, featured: true, createdAt: new Date().toISOString() },
        { id: "art11", title: "Divine Grace", artist: "Raja Ravi Varma (Modern)", price: 1300, category: "Mythological", image: "images/woman_pot_ai.jpg", dimensions: "24 x 42 inches", stock: 3, featured: false, createdAt: new Date().toISOString() },
        { id: "art12", title: "Forest Romance", artist: "Raja Ravi Varma", price: 950, category: "Mythological", image: "images/forest_couple.jpg", dimensions: "20 x 28 inches", stock: 2, featured: true, createdAt: new Date().toISOString() },
        { id: "art13", title: "Shree Lakshmi", artist: "Raja Ravi Varma", price: 1600, category: "Mythological", image: "images/lakshmi_classic.jpg", dimensions: "30 x 48 inches", stock: 1, featured: true, createdAt: new Date().toISOString() },
        { id: "art14", title: "River Nymph", artist: "Raja Ravi Varma (Modern)", price: 1150, category: "Mythological", image: "images/water_woman.jpg", dimensions: "24 x 42 inches", stock: 5, featured: false, createdAt: new Date().toISOString() },
        { id: "art15", title: "Menaka's Descent", artist: "Raja Ravi Varma", price: 1450, category: "Mythological", image: "images/flying_menaka.jpg", dimensions: "24 x 36 inches", stock: 2, featured: true, createdAt: new Date().toISOString() },
        { id: "art16", title: "Lord Murugan", artist: "Raja Ravi Varma", price: 1250, category: "Mythological", image: "images/murugan.jpg", dimensions: "24 x 32 inches", stock: 3, featured: false, createdAt: new Date().toISOString() },
        { id: "art17", title: "Divine Mother Lalitha", artist: "Raja Ravi Varma", price: 2000, category: "Mythological", image: "images/lalitha.jpg", dimensions: "36 x 48 inches", stock: 1, featured: true, createdAt: new Date().toISOString() },
        { id: "art18", title: "Yashoda & Krishna", artist: "Raja Ravi Varma", price: 1100, category: "Mythological", image: "images/yashoda_krishna.jpg", dimensions: "24 x 30 inches", stock: 4, featured: true, createdAt: new Date().toISOString() },
        { id: "art19", title: "The Mighty Garuda", artist: "Raja Ravi Varma (Modern)", price: 1350, category: "Mythological", image: "images/garuda.jpg", dimensions: "24 x 42 inches", stock: 2, featured: false, createdAt: new Date().toISOString() },
        { id: "art20", title: "Trimurti Blessing", artist: "Raja Ravi Varma (Modern)", price: 1550, category: "Mythological", image: "images/trimurti.jpg", dimensions: "30 x 40 inches", stock: 3, featured: true, createdAt: new Date().toISOString() },
        { id: "art21", title: "Bala Krishna on Leaf", artist: "Raja Ravi Varma", price: 800, category: "Mythological", image: "images/bala_krishna.jpg", dimensions: "18 x 24 inches", stock: 5, featured: false, createdAt: new Date().toISOString() },
        { id: "art22", title: "Murugan Divine Portrait", artist: "Raja Ravi Varma", price: 950, category: "Mythological", image: "images/murugan_portrait.jpg", dimensions: "15 x 20 inches", stock: 4, featured: true, createdAt: new Date().toISOString() },
        { id: "art23", title: "Yashoda's Love", artist: "Raja Ravi Varma", price: 1200, category: "Mythological", image: "images/yashoda_night.jpg", dimensions: "24 x 36 inches", stock: 2, featured: false, createdAt: new Date().toISOString() },
        { id: "art24", title: "The Mona Lisa", artist: "Leonardo da Vinci", price: 5000, category: "Classic Masterpiece", image: "images/mona_lisa.jpg", dimensions: "21 x 30 inches", stock: 1, featured: true, createdAt: new Date().toISOString() },
        { id: "art25", title: "Krishna's Childhood", artist: "Raja Ravi Varma", price: 1100, category: "Mythological", image: "images/krishna_yashoda_detail.jpg", dimensions: "24 x 30 inches", stock: 3, featured: true, createdAt: new Date().toISOString() },
        { id: "art26", title: "Rama's Grace", artist: "Raja Ravi Varma", price: 1400, category: "Mythological", image: "images/rama_grace.jpg", dimensions: "24 x 36 inches", stock: 2, featured: true, createdAt: new Date().toISOString() },
        { id: "art27", title: "The Divine Bond", artist: "Raja Ravi Varma", price: 1050, category: "Mythological", image: "images/divine_bond.jpg", dimensions: "20 x 28 inches", stock: 4, featured: false, createdAt: new Date().toISOString() },
        { id: "art28", title: "Shiva Family Blessing", artist: "Raja Ravi Varma (Modern)", price: 1900, category: "Mythological", image: "images/shiva_family.jpg", dimensions: "30 x 40 inches", stock: 1, featured: true, createdAt: new Date().toISOString() },
        { id: "art29", title: "Eternal Lakshmi", artist: "Raja Ravi Varma", price: 1350, category: "Mythological", image: "images/lakshmi_landscape.jpg", dimensions: "36 x 24 inches", stock: 3, featured: true, needsRotation: true, createdAt: new Date().toISOString() },
        { id: "art30", title: "Vishnu on Ananta Shesha", artist: "Raja Ravi Varma", price: 1750, category: "Mythological", image: "images/vishnu_shesha.jpg", dimensions: "28 x 36 inches", stock: 2, featured: false, createdAt: new Date().toISOString() },
        { id: "art31", title: "The Butter Thief", artist: "Raja Ravi Varma", price: 1200, category: "Mythological", image: "images/yashoda_krishna_butter.jpg", dimensions: "24 x 32 inches", stock: 4, featured: true, createdAt: new Date().toISOString() },
        { id: "art32", title: "Rama Darbar Assembly", artist: "Raja Ravi Varma", price: 1600, category: "Mythological", image: "images/rama_darbar_v2.jpg", dimensions: "30 x 40 inches", stock: 2, featured: false, createdAt: new Date().toISOString() },
        { id: "art33", title: "Murugan on Peacock", artist: "Raja Ravi Varma", price: 1300, category: "Mythological", image: "images/murugan_peacock.jpg", dimensions: "20 x 28 inches", stock: 5, featured: true, createdAt: new Date().toISOString() },
        { id: "art34", title: "Ananta Shesha Shayanam", artist: "Raja Ravi Varma", price: 2100, category: "Mythological", image: "images/vishnu_shesha_landscape.jpg", dimensions: "40 x 30 inches", stock: 1, featured: true, createdAt: new Date().toISOString() },
        { id: "art35", title: "Narasimha Avatar", artist: "Raja Ravi Varma", price: 1850, category: "Mythological", image: "images/narasimha_prahlad.jpg", dimensions: "24 x 36 inches", stock: 3, featured: false, createdAt: new Date().toISOString() },
        { id: "art36", title: "Shiva Family Portrait", artist: "Raja Ravi Varma", price: 1450, category: "Mythological", image: "images/shiva_parvati_ganesha.jpg", dimensions: "24 x 30 inches", stock: 2, featured: true, createdAt: new Date().toISOString() },
        { id: "art37", title: "Rama Darbar Majesty", artist: "Raja Ravi Varma", price: 1650, category: "Mythological", image: "images/rama_darbar_v3.jpg", dimensions: "30 x 40 inches", stock: 3, featured: false, createdAt: new Date().toISOString() },
        { id: "art38", title: "Vishnu Celestial Assembly", artist: "Raja Ravi Varma", price: 2400, category: "Mythological", image: "images/vishnu_shesha_assembly.jpg", dimensions: "40 x 30 inches", stock: 1, featured: true, createdAt: new Date().toISOString() },
        { id: "art39", title: "Krishna Raas Leela", artist: "Raja Ravi Varma", price: 1550, category: "Mythological", image: "images/krishna_raas_leela.jpg", dimensions: "36 x 24 inches", stock: 2, featured: true, createdAt: new Date().toISOString() },
        { id: "art40", title: "Krishna & The Gopikas", artist: "Raja Ravi Varma", price: 1350, category: "Mythological", image: "images/krishna_gopikas_cows.jpg", dimensions: "24 x 36 inches", stock: 4, featured: false, createdAt: new Date().toISOString() },
        { id: "art41", title: "The Grand Assembly", artist: "Raja Ravi Varma", price: 2600, category: "Mythological", image: "images/grand_assembly_v2.jpg", dimensions: "30 x 40 inches", stock: 1, featured: true, createdAt: new Date().toISOString() },
        { id: "art42", title: "Bala Krishna on Leaf II", artist: "Raja Ravi Varma", price: 1150, category: "Mythological", image: "images/krishna_leaf_v2.jpg", dimensions: "36 x 24 inches", stock: 3, featured: true, needsRotation: true, createdAt: new Date().toISOString() },
        { id: "art43", title: "Shiva Family by the Sea", artist: "Raja Ravi Varma", price: 1950, category: "Mythological", image: "images/shiva_sea_landscape.jpg", dimensions: "40 x 30 inches", stock: 2, featured: false, createdAt: new Date().toISOString() },
        { id: "art44", title: "Saraswati in Meditation", artist: "Raja Ravi Varma", price: 1400, category: "Mythological", image: "images/saraswati_sideways.jpg", dimensions: "36 x 24 inches", stock: 4, featured: true, needsRotation: true, createdAt: new Date().toISOString() },
        { id: "art45", title: "Krishna with Butter Pot", artist: "Raja Ravi Varma", price: 1250, category: "Mythological", image: "images/krishna_butter_pot.jpg", dimensions: "24 x 36 inches", stock: 3, featured: false, createdAt: new Date().toISOString() }
    ];

    const localArtworks = baseArtworks.map(art => ({
        ...art,
        variants: art.variants || [...DEFAULT_VARIANTS]
    }));

    artworks.length = 0;
    artworks.push(...localArtworks);
    if (onUpdateCallback) onUpdateCallback();

    // Firestore Sync
    onSnapshot(collection(db, "products"), (snapshot) => {
        const remoteArtworks = snapshot.docs.map(doc => {
            const data = doc.data();
            if (!data.variants && data.price) {
                data.variants = [{ size: "Standard", price: data.price, stock: data.stock || 10 }];
            } else if (!data.variants) {
                data.variants = [...DEFAULT_VARIANTS];
            }
            return { id: doc.id, ...data };
        });

        const merged = [...localArtworks];
        remoteArtworks.forEach(remote => {
            const idx = merged.findIndex(l => l.id === remote.id);
            if (idx !== -1) merged[idx] = remote;
            else merged.push(remote);
        });

        artworks.length = 0;
        artworks.push(...merged);
        if (onUpdateCallback) onUpdateCallback();
    });
};

export const initReviews = (db, onUpdateCallback) => {
    onSnapshot(collection(db, "reviews"), (snapshot) => {
        const remoteReviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        reviews.length = 0;
        reviews.push(...remoteReviews);
        if (onUpdateCallback) onUpdateCallback();
    });
};

export const getArtworkById = (id) => {
    return artworks.find(art => String(art.id) === String(id));
};

export const getFeaturedArtworks = () => {
    return artworks.filter(art => art.featured === true).slice(0, 6);
};

export const getStartingPrice = (art) => {
    if (!art.variants || art.variants.length === 0) return art.price || 0;
    return Math.min(...art.variants.map(v => v.price));
};

