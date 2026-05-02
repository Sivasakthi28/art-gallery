export const recent = {
    items: JSON.parse(localStorage.getItem('recentlyViewed')) || [],

    addProduct(art) {
        if (!art) return;
        
        // Remove if already exists (to move to front)
        this.items = this.items.filter(item => item.id !== art.id);
        
        // Add to front
        this.items.unshift({
            id: art.id,
            title: art.title,
            artist: art.artist,
            price: art.price,
            image: art.image,
            media: art.media || [],
            needsRotation: art.needsRotation || false
        });

        // Limit to 5
        if (this.items.length > 5) {
            this.items.pop();
        }

        this.save();
    },

    save() {
        localStorage.setItem('recentlyViewed', JSON.stringify(this.items));
    },

    getRecent() {
        return this.items;
    }
};

