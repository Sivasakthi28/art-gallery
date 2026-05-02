import { artworks, getFeaturedArtworks, getArtworkById, reviews } from './products.js';
import { cart } from './cart.js';
import { wishlist } from './wishlist.js';
import { recent } from './recent.js';

export const renderStars = (rating) => {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
};

const t = (key) => window.appInstance ? window.appInstance.t(key) : key;
const cp = (p) => window.appInstance ? window.appInstance.convertPrice(p) : p;
const fp = (p) => window.appInstance ? window.appInstance.formatPrice(p) : `$${p}`;

export const renderSliderCard = (art) => {
    return `
    <div class="slider-slide" data-link="product" data-param="${art.id}">
        <img src="${art.image}" alt="${art.title}" class="slider-image ${art.needsRotation ? 'rotate-90' : ''}" loading="lazy">
        <div class="slider-content">
            <div class="slider-badge">Featured Artwork</div>
            <h2 class="slider-title">${art.title}</h2>
            <p class="slider-artist">by ${art.artist}</p>
            <div class="slider-footer">
                <span class="slider-price">${fp(cp(art.price))}</span>
                <button class="btn btn-primary slider-view-btn" data-link="product" data-param="${art.id}">View Product</button>
            </div>
        </div>
        <div class="slider-overlay"></div>
    </div>
    `;
};

export const renderProductCard = (art) => {
    const isWishlisted = wishlist && wishlist.isInWishlist(art.id);
    const previewMedia = (art.media && art.media.length > 0) ? art.media[0] : { type: 'image', url: art.image };
    
    const ratingData = window.appInstance ? window.appInstance.getRatingData(art.id) : { avg: 0, count: 0 };
    
    // Get starting price and total stock
    // Requirement 3: Fix "Starting from" logic
    const startPrice = window.appInstance ? window.appInstance.getStartingPrice(art) : (art.price || 0);
    const hasVariants = art.variants && art.variants.length > 0;
    const totalStock = art.variants ? art.variants.reduce((acc, v) => acc + v.stock, 0) : (art.stock || 0);

    const stockStatus = totalStock === 0 
        ? '<span class="stock-badge stock-out">Out of Stock</span>'
        : totalStock < 5 
            ? `<span class="stock-badge stock-low">Only ${totalStock} left 🔥</span>`
            : '';

    return `
    <article class="product-card" data-link="product" data-param="${art.id}">
        <div class="wishlist-btn ${isWishlisted ? 'active' : ''}" onclick="event.stopPropagation(); window.toggleWishlist('${art.id}')">
            ${isWishlisted ? '❤️' : '🤍'}
        </div>
        <div class="product-image-container">
            ${art.media && art.media[0] && art.media[0].type === 'video' 
                ? `<video src="${art.media[0].url}" class="product-image ${art.needsRotation ? 'rotate-90' : ''}" muted loop onmouseover="this.play()" onmouseout="this.pause(); this.currentTime=0;"></video>` 
                : `<img src="${art.image}" alt="${art.title}" class="product-image ${art.needsRotation ? 'rotate-90' : ''}" loading="lazy">`
            }
            ${totalStock === 0 ? '<div class="out-of-stock-overlay">SOLD OUT</div>' : ''}
            <button class="quick-add btn-primary" onclick="event.stopPropagation(); ${totalStock > 0 ? `window.appInstance.addToCart('${art.id}')` : 'return false;'}">
                ${totalStock > 0 ? 'Add to Cart' : 'Unavailable'}
            </button>
        </div>
        <div class="product-info">
            <h3 class="product-title">${art.title}</h3>
            <p class="product-artist">${art.artist}</p>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 5px;">
                <p class="product-price">${art.variants ? 'Starting from ' : ''}${fp(cp(startPrice))}</p>
                <div style="color: #f39c12; font-size: 0.85rem;">
                    ${renderStars(ratingData.avg)}
                </div>
            </div>
            ${stockStatus}
        </div>
    </article>
    `;
};

export const pages = {
    home: () => `
        <section class="hero" id="home">
            <video class="hero-video" autoplay muted loop playsinline>
                <source src="https://www.pexels.com/download/video/29151073/" type="video/mp4">
            </video>
            <div class="hero-overlay"></div>
            <div class="container hero-content">
                <h1>Timeless Art for Modern Spaces</h1>
                <p>Discover a curated collection of hand-drawn sketches, exquisite paintings, and striking digital artworks from independent artists worldwide.</p>
                <button class="btn btn-primary" data-link="shop" style="margin-top: 1rem;">${t('explore')}</button>
            </div>
        </section>

        <section class="featured-slider" id="featured-slider-section" style="padding-top: var(--space-xl);">
            <div class="container">
                <h2 class="section-title">Featured Highlights</h2>
            </div>
            <div class="slider-container">
                <div class="slider-track" id="slider-track">
                    ${(getFeaturedArtworks() || []).map(renderSliderCard).join('')}
                </div>

                <button class="slider-btn left" id="slide-left" aria-label="Previous Slide">❮</button>
                <button class="slider-btn right" id="slide-right" aria-label="Next Slide">❯</button>

                <div class="slider-dots" id="slider-dots"></div>
            </div>
        </section>

        <section class="section-padding container">
            <h2 class="section-title">Featured Artworks</h2>
            <div class="product-grid">
                ${(artworks && artworks.length > 0) ? artworks.slice(0, 4).map(renderProductCard).join('') : '<p style="text-align: center; grid-column: 1/-1; padding: var(--space-lg); color: var(--text-muted);">No products found. Please add products via the Admin Dashboard.</p>'}
            </div>
            <div style="text-align: center; margin-top: var(--space-xl);">
                <button class="btn" data-link="shop">View All Artworks</button>
            </div>
        </section>

        <section class="section-padding container">
            <h2 class="section-title">Recommended for You</h2>
            <div class="product-grid">
                ${(window.appInstance?.getRecommendations() || []).slice(0, 4).map(renderProductCard).join('') || '<p>Browse more to see personalized recommendations.</p>'}
            </div>
        </section>

        ${recent.getRecent().length > 0 ? `
        <section class="section-padding container" style="border-top: 1px solid var(--border-color);">
            <h2 class="section-title">Recently Viewed</h2>
            <div class="product-grid">
                ${recent.getRecent().map(renderProductCard).join('')}
            </div>
        </section>
        ` : ''}

        <section id="about" class="section-padding" style="background-color: var(--white);">
            <div class="container" style="display: grid; grid-template-columns: 1.2fr 1fr; gap: var(--space-xl); align-items: center;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
                    <div style="text-align: center;">
                        <img src="images/varma_portrait.png" alt="Raja Ravi Varma" style="width: 100%; height: 300px; object-fit: cover; box-shadow: var(--shadow-md); border-radius: 4px; margin-bottom: 8px;">
                        <div style="font-style: italic; color: var(--text-muted); font-size: 0.8rem;">Portrait of Varma</div>
                    </div>
                    <div style="text-align: center;">
                        <img src="images/varma_painting.png" alt="Masterpiece by Varma" style="width: 100%; height: 300px; object-fit: cover; box-shadow: var(--shadow-md); border-radius: 4px; margin-bottom: 8px;">
                        <div style="font-style: italic; color: var(--text-muted); font-size: 0.8rem;">A Masterpiece</div>
                    </div>
                </div>
                <div>
                    <h2 class="section-title" style="text-align: left; margin-bottom: var(--space-md);">The Legacy of Raja Ravi Varma</h2>
                    <p style="color: var(--text-muted); margin-bottom: var(--space-md); line-height: 1.6;">Raja Ravi Varma (1848–1906) was a legendary Indian painter who revolutionized Indian art by fusing European academic techniques with purely Indian sensibilities. At AuraArt Gallery, we draw inspiration from his pioneering spirit of making fine art accessible to all.</p>
                    <p style="color: var(--text-muted); margin-bottom: var(--space-lg); line-height: 1.6;">Known for his depictions of Hindu deities and scenes from Indian literature, Varma's lithographic press ensured that his masterpieces reached the homes of millions, defining the visual identity of a nation.</p>
                    <button class="btn btn-primary" data-link="varma-history">Learn More About Varma</button>
                </div>
            </div>
        </section>

        <section id="testimonials" class="section-padding container">
            <h2 class="section-title">What Our Collectors Say</h2>
            <div class="testimonials-grid">
                <div class="testimonial-card">
                    <div class="stars">★★★★★</div>
                    <p class="testimonial-text">"The piece I ordered is absolutely breathtaking in person. It has completely transformed my living room. The delivery was fast and it was packed with incredible care."</p>
                    <p class="testimonial-author">— Sarah Jenkins</p>
                </div>
                <div class="testimonial-card">
                    <div class="stars">★★★★★</div>
                    <p class="testimonial-text">"I've been collecting art for years and the curation here is top-tier. Finding such unique, high-quality works in one place is rare. Highly recommended for serious collectors."</p>
                    <p class="testimonial-author">— Michael T.</p>
                </div>
                <div class="testimonial-card">
                    <div class="stars">★★★★★</div>
                    <p class="testimonial-text">"From the moment I saw 'Ethereal Bloom', I knew I had to have it. The certificate of authenticity and the presentation made the purchase feel truly special."</p>
                    <p class="testimonial-author">— Elena Rodriguez</p>
                </div>
                <div class="testimonial-card">
                    <div class="stars">★★★★★</div>
                    <p class="testimonial-text">"A seamless buying experience. The digital art print I received is vibrant and the paper quality is exceptional. It looks stunning framed."</p>
                    <p class="testimonial-author">— David Chen</p>
                </div>
            </div>
        </section>
    `,

    shop: () => `
        <section class="section-padding container" style="padding-top: var(--space-xxl);">
            <h1 class="section-title">${t('shop')}</h1>
            <div style="display: flex; flex-wrap: wrap; justify-content: space-between; gap: var(--space-md); margin-bottom: var(--space-lg); border-bottom: 1px solid var(--border-color); padding-bottom: var(--space-md);">
                <div class="search-bar" style="flex: 1; min-width: 250px;">
                    <input type="text" id="shop-search" placeholder="${t('search')}" style="width: 100%; padding: 0.5rem 1rem; border: 1px solid var(--border-color); font-family: var(--font-body); outline: none;" autocomplete="off">
                    <div id="search-suggestions" class="search-suggestions"></div>
                </div>
            </div>
            <div class="product-grid" id="shop-grid">
                ${(artworks && artworks.length > 0) ? artworks.map(renderProductCard).join('') : '<p style="text-align: center; grid-column: 1/-1; padding: var(--space-lg); color: var(--text-muted);">No products found. Please add products via the Admin Dashboard.</p>'}
            </div>
        </section>
        <style>
            .filter-select {
                padding: 0.5rem 1rem;
                border: 1px solid var(--border-color);
                background: transparent;
                font-family: var(--font-body);
                outline: none;
                cursor: pointer;
            }
            .product-image {
                transition: opacity 0.3s ease-in-out;
            }
            .thumb.active {
                border-color: #007185 !important;
                box-shadow: 0 0 5px rgba(0, 113, 133, 0.3);
            }
        </style>
    `,

    product: (id) => {
        const art = getArtworkById(id);
        if (!art) return `<div class="container section-padding" style="padding-top: 120px; text-align: center;"><h1>Artwork not found</h1><button class="btn" data-link="shop">Back to Gallery</button></div>`;
        
        window.currentProduct = art;
        // Requirement 8: Debug Protection
        console.log("Variants:", art.variants);
        const hasVariants = !!(art.variants && art.variants.length > 0);
        const selectedFrame = localStorage.getItem(`frame_${id}`) || 'none';
        const fp = (p) => window.appInstance ? window.appInstance.formatPrice(p) : `$${p}`;
        const cp = (p) => window.appInstance ? window.appInstance.convertPrice(p) : p;

        const selected = window.appInstance?.selectedVariants[id] || (art.variants ? art.variants[0] : null);
        const currentPrice = selected ? selected.price : art.price;
        const currentSize = selected ? selected.size : 'Standard';
        const currentStock = selected ? selected.stock : (art.stock || 0);

        const medium = art.medium || art.category || "Mixed Media";
        const dimensions = art.size || art.dimensions || '24" x 36" (Standard)';
        const orientation = art.orientation || "Portrait / Landscape";
        const description = art.description || `An exquisite ${medium.toLowerCase()} piece by ${art.artist}. This artwork captures the essence of contemporary aesthetics and emotion, making it a perfect centerpiece for any modern space.`;
        const media = (art.media && art.media.length > 0) ? art.media : [{ type: 'image', url: art.image }];

        // Calculate initial frame styles to prevent flicker
        let frameBg = 'none';
        let innerStyle = 'top: 0; left: 0; width: 100%; height: 100%;';
        
        if (selectedFrame && selectedFrame !== 'none') {
            frameBg = `url('images/frame-${selectedFrame}.png')`;
            innerStyle = 'top: 12%; left: 12%; width: 76%; height: 76%;';
        }

        return `
        <section class="container section-padding" style="padding-top: 120px;">
            <div class="product-detail-grid">
                <div class="product-gallery" style="display: flex; gap: 20px;">
                    <div class="thumbnail-strip" style="display: flex; flex-direction: column; gap: 12px; max-height: 500px; overflow-y: auto; padding-right: 5px;">
                        ${(media || []).map((item, index) => `
                            <div class="thumb ${index === 0 ? 'active' : ''}" 
                                 onclick="window.appInstance.changeMedia(${index}, '${id}')" 
                                 style="width: 60px; height: 60px; border: 2px solid ${index === 0 ? '#007185' : '#ddd'}; border-radius: 8px; cursor: pointer; flex-shrink: 0; background: #fff; overflow: hidden; transition: border-color 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                                ${item.type === 'video' 
                                    ? `<div style="position: relative; width: 100%; height: 100%;"><video src="${item.url}" style="width: 100%; height: 100%; object-fit: cover;"></video><div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: 10px; background: rgba(0,0,0,0.3); border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;">▶</div></div>`
                                    : `<img src="${item.url}" style="width: 100%; height: 100%; object-fit: cover;">`
                                }
                            </div>
                        `).join('')}
                    </div>

                    <div id="main-media-display" class="product-image-container frame-container" style="margin: 0; box-shadow: var(--shadow-lg); height: 500px; flex: 1; display: flex; align-items: center; justify-content: center; background: #fff; border-radius: 4px; position: relative; overflow: hidden;">
                        ${media[0].type === 'video' 
                            ? `<video src="${media[0].url}" controls autoplay muted class="product-image ${art.needsRotation ? 'rotate-90' : ''}" style="height: 100%; width: 100%; object-fit: contain;"></video>`
                            : `
                            <div class="zoom-container" onclick="window.appInstance.openFullscreen('${media[0].url}')" style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #fdfdfd;">
                                <div id="frame-master-wrapper" class="artwork-frame-wrapper ${selectedFrame !== 'none' ? 'has-frame' : ''}" style="position: relative; width: ${selectedFrame !== 'none' ? 'auto' : '100%'}; height: 500px; display: flex; align-items: center; justify-content: center; background-size: 100% 100%; background-position: center; transition: all 0.5s ease-in-out; background-image: ${frameBg};">
                                    <div id="artwork-inner-container" style="position: relative; transition: all 0.5s ease-in-out; display: flex; align-items: center; justify-content: center; overflow: hidden; ${innerStyle}">
                                        <img src="${media[0].url}" alt="${art.title}" class="zoom-image ${art.needsRotation ? 'rotate-90' : ''}" style="max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; box-shadow: 0 4px 15px rgba(0,0,0,0.1); z-index: 1;">
                                    </div>
                                </div>
                                <div class="zoom-hint" style="z-index: 3;">Roll over to zoom | Click for full view</div>
                            </div>
                            `
                        }
                    </div>
                </div>
                <div class="product-details" style="padding-top: var(--space-md);">
                    <h1 style="font-size: 3rem; margin-bottom: var(--space-sm);">${art.title}</h1>
                    <p style="font-size: 1.2rem; color: var(--text-muted); margin-bottom: var(--space-lg);">by ${art.artist}</p>
                    
                    <div id="product-price-display" style="font-size: 2.2rem; font-weight: 600; color: var(--accent-color); margin-bottom: var(--space-md);">
                        ${hasVariants ? 'Starting from ' : ''}${fp(cp(currentPrice))}
                    </div>

                    <!-- Frame Selection -->
                    <div class="frame-selector" style="margin-bottom: var(--space-lg);">
                        <span style="display: block; font-weight: 600; margin-bottom: 12px; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-muted);">Choose a Frame</span>
                        <div class="frame-selector-group" id="product-frame-group">
                            <div class="frame-card ${(!selectedFrame || selectedFrame === 'none') ? 'active' : ''}" onclick="window.appInstance.selectFrame('none')" data-frame="none">
                                <div class="frame-preview-thumb">
                                    <span style="font-size: 0.6rem; color: #999; text-transform: uppercase;">None</span>
                                </div>
                                <span class="frame-name">No Frame</span>
                            </div>
                            <div class="frame-card ${selectedFrame === 'brown' ? 'active' : ''}" onclick="window.appInstance.selectFrame('brown')" data-frame="brown">
                                <img src="images/frame-brown.png" class="frame-preview-thumb">
                                <span class="frame-name">Brown Frame</span>
                            </div>
                            <div class="frame-card ${selectedFrame === 'golden' ? 'active' : ''}" onclick="window.appInstance.selectFrame('golden')" data-frame="golden">
                                <img src="images/frame-golden.png" class="frame-preview-thumb">
                                <span class="frame-name">Golden Frame</span>
                            </div>
                            ${(window.appInstance.frames || []).map(frame => `
                                <div class="frame-card ${selectedFrame === frame.id ? 'active' : ''}" onclick="window.appInstance.selectFrame('${frame.id}')" data-frame="${frame.id}">
                                    <img src="${frame.url}" class="frame-preview-thumb">
                                    <span class="frame-name">${frame.name} Frame</span>
                                </div>
                            `).join('')}
                        </div>
                        <button class="wall-toggle-btn" id="wall-view-toggle" onclick="window.appInstance.toggleWallView()">
                            <span class="icon">🏠</span>
                            <span>View on Wall</span>
                        </button>
                    </div>

                    <!-- Size Selection -->
                    ${art.variants ? `
                    <div class="size-selector" style="margin-bottom: var(--space-lg);">
                        <span style="display: block; font-weight: 600; margin-bottom: 10px; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">Select Size (Inches)</span>
                        <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                            ${(art.variants || []).map((v, i) => `
                                <button class="size-opt ${(selected && selected.size === v.size) || (!selected && i === 0) ? 'active' : ''} ${v.stock === 0 ? 'out' : ''}" 
                                        onclick="window.appInstance.selectSize('${v.size}', ${v.price}, ${v.stock}, this)"
                                        ${v.stock === 0 ? 'disabled' : ''}
                                        style="padding: 10px 20px; border: 1px solid var(--border-color); background: ${(selected && selected.size === v.size) || (!selected && i === 0) ? 'var(--text-color)' : 'transparent'}; color: ${(selected && selected.size === v.size) || (!selected && i === 0) ? 'var(--white)' : 'var(--text-color)'}; cursor: ${v.stock === 0 ? 'not-allowed' : 'pointer'}; border-radius: 4px; font-size: 0.9rem; transition: all 0.2s; position: relative; opacity: ${v.stock === 0 ? '0.5' : '1'};">
                                    ${v.size}
                                    ${v.stock === 0 ? '<span style="position: absolute; top: -5px; right: -5px; background: #e74c3c; color: white; font-size: 0.6rem; padding: 2px 5px; border-radius: 10px;">OUT</span>' : ''}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                    
                    <p class="product-description" style="margin-bottom: var(--space-lg); line-height: 1.6; color: var(--text-color);">
                        ${t('description')}: Experience the timeless beauty of <strong>${art.title}</strong> by the legendary <strong>${art.artist}</strong>. This masterwork is a testament to the artist's unique vision and technical prowess.
                    </p>


                    <div style="margin-bottom: var(--space-lg);">
                        ${art.stock === 0 
                            ? `<span class="stock-badge stock-out" style="font-size: 1rem; padding: 8px 16px;">${t('outOfStock')}</span>`
                            : art.stock < 5
                                ? `<span class="stock-badge stock-low" style="font-size: 1rem; padding: 8px 16px;">${t('limitedEdition')} - Only ${art.stock} left 🔥</span>`
                                : `<span class="stock-badge stock-ok" style="font-size: 1rem; padding: 8px 16px;">${t('inStock')}</span>`
                        }
                    </div>
                    
                    <div style="display: flex; flex-direction: column; gap: var(--space-md); margin-bottom: var(--space-xl);">
                        <button id="add-to-cart-btn" class="btn btn-primary" style="padding: 1.2rem; display: flex; align-items: center; justify-content: center; gap: 10px;" 
                                onclick="window.appInstance.addToCart('${art.id}', window.currentFrame || 'none', window.appInstance?.selectedVariants['${art.id}']?.size || '${currentSize}', window.appInstance?.selectedVariants['${art.id}']?.price || ${currentPrice})"
                                ${currentStock === 0 ? 'disabled style="background: #ccc; cursor: not-allowed;"' : ''}>
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                            <span id="cart-btn-text">${currentStock === 0 ? t('outOfStock') : t('addToCart')}</span>
                        </button>
                        <button class="btn-whatsapp" onclick="window.appInstance.contactWhatsApp('${art.id}')">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.438 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.438-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.011c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/></svg>
                            Chat on WhatsApp
                        </button>
                    </div>

                    <div style="border-top: 1px solid var(--border-color); padding-top: var(--space-md); font-size: 0.9rem; color: var(--text-muted);">
                        <p>✓ Certificate of Authenticity included</p>
                        <p>✓ Free worldwide shipping on orders over $1000</p>
                        <p>✓ 14-day return policy</p>
                    </div>
                </div>
            </div>

            <!-- Reviews Section -->
            <div style="margin-top: var(--space-xxl); border-top: 1px solid var(--border-color); padding-top: var(--space-xxl);">
            <div class="review-grid">
                    <div>
                        <h2 style="font-size: 2rem; margin-bottom: var(--space-md);">Customer Reviews</h2>
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: var(--space-lg);">
                            <div style="font-size: 3rem; font-weight: 700; color: var(--accent-color);">
                                ${window.appInstance ? window.appInstance.getRatingData(id).avg : '0'}
                            </div>
                            <div>
                                <div style="color: #f39c12; font-size: 1.2rem;">
                                    ${renderStars(window.appInstance ? window.appInstance.getRatingData(id).avg : 0)}
                                </div>
                                <div style="font-size: 0.9rem; color: var(--text-muted);">
                                    Based on ${window.appInstance ? window.appInstance.getRatingData(id).count : 0} reviews
                                </div>
                            </div>
                        </div>

                        ${window.appInstance?.user ? `
                            <div style="background: #f9f9f9; padding: var(--space-lg); border-radius: 8px;">
                                <h3 style="margin-bottom: var(--space-sm);">Write a Review</h3>
                                <form onsubmit="event.preventDefault(); window.appInstance.submitReview('${id}', this.rating.value, this.comment.value); this.reset();">
                                    <div style="margin-bottom: var(--space-md);">
                                        <label style="display: block; font-size: 0.8rem; margin-bottom: 5px;">Rating</label>
                                        <select name="rating" required style="width: 100%; padding: 10px; border: 1px solid var(--border-color);">
                                            <option value="5">5 Stars - Excellent</option>
                                            <option value="4">4 Stars - Very Good</option>
                                            <option value="3">3 Stars - Good</option>
                                            <option value="2">2 Stars - Fair</option>
                                            <option value="1">1 Star - Poor</option>
                                        </select>
                                    </div>
                                    <div style="margin-bottom: var(--space-md);">
                                        <label style="display: block; font-size: 0.8rem; margin-bottom: 5px;">Comment</label>
                                        <textarea name="comment" required style="width: 100%; padding: 10px; border: 1px solid var(--border-color); height: 100px; resize: none;"></textarea>
                                    </div>
                                    <button type="submit" class="btn btn-primary" style="width: 100%;">Post Review</button>
                                </form>
                            </div>
                        ` : `
                            <div style="padding: var(--space-lg); border: 1px dashed var(--border-color); text-align: center;">
                                <p style="color: var(--text-muted); margin-bottom: var(--space-md);">Please log in to write a review.</p>
                                <button class="btn" data-link="login">Login Now</button>
                            </div>
                        `}
                    </div>

                    <div style="display: flex; flex-direction: column; gap: var(--space-lg);">
                        ${reviews.filter(r => r.productId === id).length > 0 ? 
                            reviews.filter(r => r.productId === id)
                                .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
                                .map(review => `
                                <div style="border-bottom: 1px solid #eee; padding-bottom: var(--space-lg);">
                                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px;">
                                        <div>
                                            <span style="font-weight: 600;">${review.userName}</span>
                                            <span style="color: #f39c12; margin-left: 10px;">${renderStars(review.rating)}</span>
                                        </div>
                                        <span style="font-size: 0.8rem; color: var(--text-muted);">
                                            ${new Date(review.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p style="color: var(--text-muted); line-height: 1.6; margin-bottom: 10px;">${review.comment}</p>
                                    ${window.appInstance?.user && window.appInstance.user.uid === review.userId ? `
                                        <div style="display: flex; gap: 15px; font-size: 0.8rem;">
                                            <button onclick="window.appInstance.editReview('${review.id}')" style="color: var(--accent-color); text-decoration: underline;">Edit</button>
                                            <button onclick="window.appInstance.deleteReview('${review.id}')" style="color: #e74c3c; text-decoration: underline;">Delete</button>
                                        </div>
                                    ` : ''}
                                </div>
                            `).join('') : `
                            <p style="color: var(--text-muted); text-align: center; padding: var(--space-xl);">No reviews yet. Be the first to review this artwork!</p>
                        `}
                    </div>
                </div>
            </div>
        </section>
        `;
    },

    cart: () => {
        const items = cart.items;
        if (items.length === 0) {
            return `
            <section class="container section-padding" style="padding-top: 120px; text-align: center; min-height: 60vh;">
                <h1 class="section-title">${t('emptyCart')}</h1>
                <p style="color: var(--text-muted); margin-bottom: var(--space-lg);">Looks like you haven't added any artworks yet.</p>
                <button class="btn btn-primary" data-link="shop">${t('continueShopping')}</button>
            </section>
            `;
        }

        return `
        <section class="container section-padding" style="padding-top: 120px; min-height: 60vh;">
            <h1 class="section-title" style="text-align: left;">Your Cart</h1>
            <div class="cart-grid">
                <div class="cart-items">
                    ${(items || []).map(item => `
                        <div style="display: flex; gap: var(--space-md); border-bottom: 1px solid var(--border-color); padding-bottom: var(--space-md); margin-bottom: var(--space-md);">
                            <img src="${item.image}" alt="${item.title}" style="width: 100px; height: 100px; object-fit: cover;">
                            <div style="flex: 1;">
                                <h3 style="font-size: 1.2rem; margin-bottom: 0.2rem;">${item.title}</h3>
                                <p style="color: var(--text-muted); font-size: 0.9rem;">${item.artist}</p>
                                <div style="display: flex; gap: 10px; margin-top: 5px;">
                                    ${item.size ? `<span style="background: #f0f0f0; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 500;">Size: ${item.size}</span>` : ''}
                                    ${item.frame && item.frame !== 'none' ? `<span style="background: #f0f0f0; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 500; color: var(--accent-color);">Frame: ${item.frame.charAt(0).toUpperCase() + item.frame.slice(1)}</span>` : ''}
                                </div>
                                <button onclick="window.removeFromCart('${item.id}')" style="color: #d9534f; font-size: 0.8rem; margin-top: var(--space-sm); text-decoration: underline;">Remove</button>
                            </div>
                            <div style="text-align: right;">
                                <p style="font-weight: 500; margin-bottom: var(--space-sm);">${fp(cp(item.price))}</p>
                                <div style="display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem;">
                                    <button onclick="window.updateQuantity('${item.id}', ${item.quantity - 1})" style="padding: 0 0.5rem; border: 1px solid var(--border-color);">-</button>
                                    <span>${item.quantity}</span>
                                    <button onclick="window.updateQuantity('${item.id}', ${item.quantity + 1})" style="padding: 0 0.5rem; border: 1px solid var(--border-color);">+</button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="cart-summary" style="background: var(--white); padding: var(--space-lg); border: 1px solid var(--border-color); height: fit-content;">
                    <h3 style="margin-bottom: var(--space-md); border-bottom: 1px solid var(--border-color); padding-bottom: var(--space-sm);">${t('total')}</h3>
                    <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-sm);">
                        <span>${t('subtotal')}</span>
                        <span>${fp(cp(cart.getTotalPrice()))}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-lg); color: var(--text-muted);">
                        <span>${t('shipping')}</span>
                        <span>Calculated at checkout</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-lg); font-weight: 600; font-size: 1.2rem; border-top: 1px solid var(--border-color); padding-top: var(--space-sm);">
                        <span>${t('total')}</span>
                        <span>${fp(cp(cart.getTotalPrice()))}</span>
                    </div>
                    <button class="btn btn-primary" style="width: 100%; position: relative;" onclick="window.payNow()">
                        ${t('checkout')}
                    </button>
                </div>
            </div>
        </section>
        `;
    },

    checkout: () => `
        <section class="container section-padding" style="padding-top: 120px; min-height: 60vh;">
            <h1 class="section-title" style="text-align: left;">Checkout</h1>
            <div class="checkout-grid">
                <form id="checkout-form" style="display: flex; flex-direction: column; gap: var(--space-md);">
                    <h3 style="margin-bottom: var(--space-sm);">Contact Information</h3>
                    <input type="email" placeholder="Email" required style="padding: 0.8rem; border: 1px solid var(--border-color); outline: none; width: 100%;">
                    
                    <h3 style="margin-top: var(--space-md); margin-bottom: var(--space-sm);">Shipping Address</h3>
                    <div class="form-row-2">
                        <input type="text" placeholder="First Name" required style="padding: 0.8rem; border: 1px solid var(--border-color); outline: none;">
                        <input type="text" placeholder="Last Name" required style="padding: 0.8rem; border: 1px solid var(--border-color); outline: none;">
                    </div>
                    <input type="text" placeholder="Address" required style="padding: 0.8rem; border: 1px solid var(--border-color); outline: none; width: 100%;">
                    <div class="form-row-3">
                        <input type="text" placeholder="City" required style="padding: 0.8rem; border: 1px solid var(--border-color); outline: none;">
                        <input type="text" placeholder="State/Province" required style="padding: 0.8rem; border: 1px solid var(--border-color); outline: none;">
                        <input type="text" placeholder="ZIP Code" required style="padding: 0.8rem; border: 1px solid var(--border-color); outline: none;">
                    </div>

                    <h3 style="margin-top: var(--space-md); margin-bottom: var(--space-sm);">Payment Method</h3>
                    <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: var(--space-sm);">
                        <label style="display: flex; align-items: center; gap: 10px; padding: 10px; border: 1px solid var(--border-color); cursor: pointer; border-radius: 4px;">
                            <input type="radio" name="payment-method" value="upi" checked> Google Pay / PhonePe (UPI)
                        </label>
                        <label style="display: flex; align-items: center; gap: 10px; padding: 10px; border: 1px solid var(--border-color); cursor: pointer; border-radius: 4px;">
                            <input type="radio" name="payment-method" value="card"> Credit / Debit Card
                        </label>
                        <label style="display: flex; align-items: center; gap: 10px; padding: 10px; border: 1px solid var(--border-color); cursor: pointer; border-radius: 4px;">
                            <input type="radio" name="payment-method" value="netbanking"> Net Banking
                        </label>
                    </div>
                    <p style="font-size: 0.8rem; color: var(--text-muted);">*Razorpay will securely process your selected payment method on the next screen.</p>
                    
                    <button type="submit" class="btn btn-primary" style="margin-top: var(--space-lg);">Place Order</button>
                </form>
                
                <div class="cart-summary" style="background: var(--white); padding: var(--space-lg); border: 1px solid var(--border-color); height: fit-content;">
                    <h3 style="margin-bottom: var(--space-md); border-bottom: 1px solid var(--border-color); padding-bottom: var(--space-sm);">Order Summary</h3>
                    
                    <div style="margin-bottom: var(--space-lg); max-height: 300px; overflow-y: auto;">
                        ${(cart.items || []).map(item => `
                            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 0.9rem;">
                                <span>${item.title} x ${item.quantity} ${item.frame !== 'none' ? `<br><small style="color: var(--accent-color);">Frame: ${item.frame}</small>` : ''}</span>
                                <span>${fp(cp(item.price * item.quantity))}</span>
                            </div>
                        `).join('')}
                    </div>

                    <div style="margin-bottom: var(--space-lg);">
                        <div style="display: flex; gap: 10px;">
                            <input type="text" id="coupon-code" placeholder="Coupon Code" style="flex: 1; padding: 10px; border: 1px solid var(--border-color); outline: none;">
                            <button type="button" class="btn" onclick="window.appInstance.applyCoupon(document.getElementById('coupon-code').value)" style="padding: 10px 15px;">Apply</button>
                        </div>
                        <div id="coupon-message" style="font-size: 0.8rem; margin-top: 5px;"></div>
                    </div>

                    <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-sm);">
                        <span>${t('subtotal')}</span>
                        <span>${fp(cp(cart.getTotalPrice()))}</span>
                    </div>
                    <div id="discount-row" style="display: none; justify-content: space-between; margin-bottom: var(--space-sm); color: #4CAF50;">
                        <span>Discount</span>
                        <span id="discount-amount">-$0</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-sm); color: var(--text-muted);">
                        <span>${t('shipping')}</span>
                        <span>Free</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-lg); font-weight: 600; font-size: 1.2rem; border-top: 1px solid var(--border-color); padding-top: var(--space-sm);">
                        <span>${t('total')}</span>
                        <span id="checkout-final-total">${fp(cp(cart.getTotalPrice()))}</span>
                    </div>
                </div>
            </div>
        </section>
    `,
    
    login: () => `
        <section class="container section-padding" style="padding-top: 120px; min-height: 60vh; display: flex; justify-content: center; align-items: center;">
            <div style="background: var(--white); padding: var(--space-xl); border: 1px solid var(--border-color); box-shadow: var(--shadow-md); width: 100%; max-width: 400px; text-align: center;">
                <h2 style="margin-bottom: var(--space-lg);">Login</h2>
                <form id="login-form" style="display: flex; flex-direction: column; gap: var(--space-md);">
                    <input type="email" id="login-email" placeholder="Email" required style="padding: 0.8rem; border: 1px solid var(--border-color); outline: none; width: 100%;">
                    <input type="password" id="login-password" placeholder="Password" required style="padding: 0.8rem; border: 1px solid var(--border-color); outline: none; width: 100%;">
                    <button type="submit" class="btn btn-primary" style="margin-top: var(--space-sm);">Sign In</button>
                </form>
                <p style="margin-top: var(--space-md); color: var(--text-muted); font-size: 0.9rem;">Don't have an account? <a href="#" id="open-signup-from-login" style="color: var(--text-color); text-decoration: underline;">Sign up</a></p>
            </div>
        </section>
    `,

    'wishlist': () => {
        const items = wishlist.items;
        if (items.length === 0) {
            return `
            <section class="container section-padding" style="padding-top: 120px; text-align: center; min-height: 60vh;">
                <h1 class="section-title">Your Wishlist is Empty</h1>
                <p style="color: var(--text-muted); margin-bottom: var(--space-lg);">Discover artworks you love and save them here.</p>
                <button class="btn btn-primary" data-link="shop">Explore Gallery</button>
            </section>
            `;
        }

        return `
        <section class="container section-padding" style="padding-top: 120px; min-height: 60vh;">
            <h1 class="section-title" style="text-align: left;">Your Wishlist</h1>
            <div class="product-grid">
                ${items.map(item => {
                    const hasVariants = item.variants && item.variants.length > 0;
                    const startPrice = hasVariants ? Math.min(...item.variants.map(v => v.price)) : item.price;
                    return `
                    <article class="product-card" style="position: relative;" data-link="product" data-param="${item.id}">
                        <div class="wishlist-btn active" onclick="event.stopPropagation(); window.removeFromWishlist('${item.id}')">
                            ❤️
                        </div>
                        <div class="product-image-container">
                            <img src="${item.image}" alt="${item.title}" class="product-image ${item.needsRotation ? 'rotate-90' : ''}">
                        </div>
                        <div class="product-info">
                            <div class="product-artist">${item.artist}</div>
                            <h3 class="product-title">${item.title}</h3>
                            <button class="btn btn-primary" onclick="event.stopPropagation(); window.moveToCart('${item.id}')" style="width: 100%; margin-top: 1rem;">Move to Cart</button>
                        </div>
                    </article>
                    `;
                }).join('')}
            </div>
        </section>
        `;
    },

    'my-orders': () => `
        <section class="container section-padding" style="padding-top: 120px; min-height: 60vh;">
            <h1 class="section-title" style="text-align: left;">My Orders</h1>
            <div id="my-orders-container">
                <p>Loading your orders...</p>
            </div>
        </section>
    `,

    'admin': () => `
        <section class="container section-padding" style="padding-top: 120px; min-height: 60vh;">
            <h1 class="section-title" style="text-align: left;">Admin Dashboard</h1>
            
            <div style="margin-bottom: var(--space-lg); border-bottom: 1px solid var(--border-color); display: flex; gap: var(--space-md); overflow-x: auto; padding-bottom: 10px;">
                <button class="btn btn-primary" onclick="window.appInstance.switchAdminTab('orders')" id="tab-btn-orders">Orders</button>
                <button class="btn" style="border: 1px solid var(--border-color); background: transparent; color: var(--text-color);" onclick="window.appInstance.switchAdminTab('products')" id="tab-btn-products">Products</button>
                <button class="btn" style="border: 1px solid var(--border-color); background: transparent; color: var(--text-color);" onclick="window.appInstance.switchAdminTab('coupons')" id="tab-btn-coupons">Coupons</button>
                <button class="btn" style="border: 1px solid var(--border-color); background: transparent; color: var(--text-color);" onclick="window.appInstance.switchAdminTab('analytics')" id="tab-btn-analytics">Analytics</button>
                <button class="btn" style="border: 1px solid var(--border-color); background: transparent; color: var(--text-color);" onclick="window.appInstance.switchAdminTab('frames')" id="tab-btn-frames">Frames</button>
            </div>

            <div id="admin-tab-orders">
                <div id="admin-orders-container" style="overflow-x: auto;">
                    <p>Loading all orders...</p>
                </div>
            </div>

            <div id="admin-tab-products" style="display: none;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md);">
                    <h3>Manage Products</h3>
                    <div>
                        <button class="btn btn-primary" onclick="window.appInstance.resetProductForm(false); document.getElementById('add-product-modal').style.display='flex'">+ Add Product</button>
                    </div>
                </div>
                <div id="admin-products-container" style="overflow-x: auto;">
                    <p>Loading products...</p>
                </div>
            </div>

            <div id="admin-tab-coupons" style="display: none;">
                <div style="display: grid; grid-template-columns: 1fr 2fr; gap: var(--space-lg);">
                    <div style="background: var(--white); padding: var(--space-lg); border-radius: 8px; border: 1px solid var(--border-color); height: fit-content;">
                        <h3 style="margin-bottom: var(--space-md);">Create Coupon</h3>
                        <form id="add-coupon-form" onsubmit="event.preventDefault(); window.appInstance.addCoupon(this); this.reset();" style="display: flex; flex-direction: column; gap: var(--space-md);">
                            <input type="text" name="code" placeholder="Code (e.g. ART20)" required style="padding: 10px; border: 1px solid var(--border-color);">
                            <select name="type" required style="padding: 10px; border: 1px solid var(--border-color);">
                                <option value="percentage">Percentage (%)</option>
                                <option value="fixed">Fixed Amount ($)</option>
                            </select>
                            <input type="number" name="value" placeholder="Discount Value" required style="padding: 10px; border: 1px solid var(--border-color);">
                            <input type="date" name="expiry" required style="padding: 10px; border: 1px solid var(--border-color);">
                            <button type="submit" class="btn btn-primary">Create Coupon</button>
                        </form>
                    </div>
                    <div style="background: var(--white); padding: var(--space-lg); border-radius: 8px; border: 1px solid var(--border-color);">
                        <h3 style="margin-bottom: var(--space-md);">Existing Coupons</h3>
                        <div id="admin-coupons-container">
                            <p>Loading coupons...</p>
                        </div>
                    </div>
                </div>
            </div>

            <div id="admin-tab-analytics" style="display: none;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-md); margin-bottom: var(--space-xl);">
                    <div style="background: var(--white); padding: var(--space-md); border-radius: 8px; border: 1px solid var(--border-color); text-align: center; box-shadow: var(--shadow-sm);">
                        <h4 style="color: var(--text-muted); margin-bottom: 5px;">Total Revenue</h4>
                        <h2 id="analytics-revenue" style="color: var(--accent-color); font-size: 2rem;">$0</h2>
                    </div>
                    <div style="background: var(--white); padding: var(--space-md); border-radius: 8px; border: 1px solid var(--border-color); text-align: center; box-shadow: var(--shadow-sm);">
                        <h4 style="color: var(--text-muted); margin-bottom: 5px;">Total Orders</h4>
                        <h2 id="analytics-orders" style="font-size: 2rem;">0</h2>
                    </div>
                    <div style="background: var(--white); padding: var(--space-md); border-radius: 8px; border: 1px solid var(--border-color); text-align: center; box-shadow: var(--shadow-sm);">
                        <h4 style="color: var(--text-muted); margin-bottom: 5px;">Avg Order Value</h4>
                        <h2 id="analytics-aov" style="font-size: 2rem;">$0</h2>
                    </div>
                    <div style="background: var(--white); padding: var(--space-md); border-radius: 8px; border: 1px solid var(--border-color); text-align: center; box-shadow: var(--shadow-sm);">
                        <h4 style="color: var(--text-muted); margin-bottom: 5px;">Conversion Rate</h4>
                        <h2 id="analytics-conversion" style="font-size: 2rem;">2.4%</h2>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: var(--space-lg); margin-bottom: var(--space-xl);">
                    <div style="background: var(--white); padding: var(--space-lg); border-radius: 8px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); height: 400px;">
                        <h3 style="margin-bottom: var(--space-md);">Revenue Over Time</h3>
                        <div style="height: 300px; position: relative;">
                            <canvas id="revenueChart"></canvas>
                        </div>
                    </div>
                    <div style="background: var(--white); padding: var(--space-lg); border-radius: 8px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); height: 400px;">
                        <h3 style="margin-bottom: var(--space-md);">Sales by Category</h3>
                        <div style="height: 300px; position: relative;">
                            <canvas id="categoryChart"></canvas>
                        </div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-lg);">
                    <div style="background: var(--white); padding: var(--space-lg); border-radius: 8px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); min-height: 400px;">
                        <h3 style="margin-bottom: var(--space-md);">Top Selling Artworks</h3>
                        <div id="top-products-list">
                            <!-- Populated by JS -->
                        </div>
                    </div>
                    <div style="background: var(--white); padding: var(--space-lg); border-radius: 8px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); height: 400px;">
                        <h3 style="margin-bottom: var(--space-md);">Orders by Status</h3>
                        <div style="height: 300px; position: relative;">
                            <canvas id="statusChart"></canvas>
                        </div>
                    </div>
                    </div>
                </div>
            </div>

            <div id="admin-tab-frames" style="display: none;">
                <div style="display: grid; grid-template-columns: 1fr 2fr; gap: var(--space-lg);">
                    <div style="background: var(--white); padding: var(--space-lg); border-radius: 8px; border: 1px solid var(--border-color); height: fit-content;">
                        <h3 style="margin-bottom: var(--space-md);">Upload Frame Style</h3>
                        <form id="add-frame-form" onsubmit="event.preventDefault(); window.appInstance.addFrame(this); this.reset();" style="display: flex; flex-direction: column; gap: var(--space-md);">
                            <input type="text" name="name" placeholder="Frame Name (e.g. Silver)" required style="padding: 10px; border: 1px solid var(--border-color);">
                            <input type="file" name="file" accept="image/png" required style="padding: 10px; border: 1px solid var(--border-color);">
                            <small style="color: var(--text-muted);">Please upload a PNG with a transparent center.</small>
                            <button type="submit" class="btn btn-primary">Upload Frame</button>
                        </form>
                    </div>
                    <div style="background: var(--white); padding: var(--space-lg); border-radius: 8px; border: 1px solid var(--border-color);">
                        <h3 style="margin-bottom: var(--space-md);">Existing Frames</h3>
                        <div id="admin-frames-container" class="admin-frames-grid">
                            <p>Loading frames...</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Add Product Modal -->
            <div id="add-product-modal" class="modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; justify-content: center; align-items: center;">
                <div class="modal-content" style="background: var(--white); padding: var(--space-xl); border-radius: 8px; width: 90%; max-width: 500px; max-height: 90vh; overflow-y: auto;">
                    <span onclick="window.appInstance.resetProductForm()" style="float: right; cursor: pointer; font-size: 1.5rem;">&times;</span>
                    <h2>Add New Product</h2>
                    <form id="add-product-form" style="display: flex; flex-direction: column; gap: var(--space-md); margin-top: var(--space-md);">
                        <input type="text" id="prod-title" placeholder="Title" required style="padding: 10px; border: 1px solid var(--border-color);">
                        <input type="text" id="prod-artist" placeholder="Artist" required style="padding: 10px; border: 1px solid var(--border-color);">
                        <input type="number" id="prod-price" placeholder="Price ($)" required style="padding: 10px; border: 1px solid var(--border-color);">
                        <select id="prod-category" required style="padding: 10px; border: 1px solid var(--border-color);">
                            <option value="">Select Category</option>
                            <option value="Painting">Painting</option>
                            <option value="Sculpture">Sculpture</option>
                            <option value="Photography">Photography</option>
                            <option value="Digital">Digital</option>
                        </select>
                        <select id="prod-dimensions" required style="padding: 10px; border: 1px solid var(--border-color);">
                            <option value="">Select Dimensions</option>
                            <option value="16*18">16*18</option>
                            <option value="20*22">20*22</option>
                            <option value="24*28">24*28</option>
                            <option value="24*30">24*30</option>
                        </select>
                        <div style="display: flex; flex-direction: column; gap: 5px;">
                            <label style="font-size: 0.8rem; color: var(--text-muted);">Primary Image (Upload & Crop)</label>
                            <input type="file" id="prod-image-upload" accept="image/*" style="padding: 10px; border: 1px solid var(--border-color);" onchange="window.appInstance.handleImageSelect(event)">
                            
                            <div class="cropper-container-wrapper" id="cropper-wrapper" style="display: none;">
                                <img id="cropper-image" src="">
                            </div>
                            <button type="button" id="crop-btn" class="btn btn-secondary" style="display: none;" onclick="window.appInstance.performCrop()">Crop Image</button>
                            <input type="hidden" id="prod-primary-image-url">
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 5px;">
                            <label style="font-size: 0.8rem; color: var(--text-muted);">Variants (Size, Price, Stock)</label>
                            <div id="variant-rows-container">
                                <!-- Dynamic rows go here -->
                            </div>
                            <button type="button" class="btn" style="border: 1px dashed var(--border-color); background: #f9f9f9; color: var(--text-color);" onclick="window.appInstance.addVariantRow()">+ Add Variant</button>
                        </div>
                        <input type="number" id="prod-stock" placeholder="Default Stock (if no variants)" min="0" value="10" style="padding: 10px; border: 1px solid var(--border-color);">
                        <label style="display: flex; align-items: center; gap: 10px; color: var(--text-color);">
                            <input type="checkbox" id="prod-featured"> Featured Product
                        </label>
                        <button type="submit" class="btn btn-primary" id="prod-submit-btn">Save Product</button>
                    </form>
                </div>
            </div>

        </section>
    `,

    'success': () => `
        <section class="container section-padding" style="padding-top: 120px; min-height: 60vh; text-align: center;">
            <div style="background: var(--white); padding: var(--space-xl); border: 1px solid var(--border-color); box-shadow: var(--shadow-md); max-width: 600px; margin: 0 auto;">
                <h1 style="color: var(--accent-color); margin-bottom: var(--space-md);">Payment Successful 🎉</h1>
                <p style="margin-bottom: var(--space-lg); color: var(--text-muted);">Thank you for your purchase! Your order has been placed successfully.</p>
                
                <div id="order-details-container" style="margin-bottom: var(--space-lg);">
                    <p>Fetching order details...</p>
                </div>

                <div style="display: flex; gap: var(--space-md); justify-content: center; flex-wrap: wrap;">
                    <button class="btn btn-primary" data-link="home">Go to Home</button>
                    <button class="btn" style="border: 1px solid var(--text-color); background: transparent; color: var(--text-color);" data-link="my-orders">View Orders</button>
                <button class="btn" style="background: #333; color: white;" onclick="window.appInstance.downloadInvoice()">Download Invoice (AuraArt Gallery)</button>
                </div>
            </div>
        </section>
    `,

    'track-order': () => `
        <section class="container section-padding" style="padding-top: 120px; min-height: 60vh;">
            <h1 class="section-title" style="text-align: left;">Track Order</h1>
            <div id="track-order-container" style="background: var(--white); padding: var(--space-xl); border: 1px solid var(--border-color); border-radius: 8px;">
                <p>Loading tracking information...</p>
            </div>
            <div style="margin-top: var(--space-lg); text-align: center;">
                <button class="btn" style="border: 1px solid var(--text-color); background: transparent; color: var(--text-color);" data-link="my-orders">Back to Orders</button>
            </div>
        </section>
    `,

    'varma-history': () => `
        <section class="container section-padding" style="padding-top: 120px; min-height: 80vh;">
            <div style="max-width: 900px; margin: 0 auto;">
                <h1 class="section-title" style="text-align: left; font-size: 2.5rem; margin-bottom: var(--space-xl);">The Extraordinary Life of Raja Ravi Varma</h1>
                
                <div style="display: grid; grid-template-columns: 1fr 1.5fr; gap: var(--space-xl); margin-bottom: var(--space-xxl); align-items: start;">
                    <img src="images/varma_portrait.png" alt="Raja Ravi Varma" style="width: 100%; border-radius: 8px; box-shadow: var(--shadow-lg);">
                    <div>
                        <h2 style="margin-bottom: var(--space-md);">Early Life and Royal Roots</h2>
                        <p style="color: var(--text-muted); line-height: 1.8; margin-bottom: var(--space-md);">
                            Born in 1848 in the princely state of Kilimanoor, Kerala, Raja Ravi Varma displayed a talent for art from a very young age. His uncle, Raja Raja Varma, noticed his talent and provided him with early training in traditional Tanjore art. 
                        </p>
                        <p style="color: var(--text-muted); line-height: 1.8;">
                            However, it was his encounter with Theodore Jensen, a Dutch painter visiting the court of Travancore, that introduced him to oil painting and the techniques of European Academic Realism. This encounter would change the course of Indian art history forever.
                        </p>
                    </div>
                </div>

                <div style="margin-bottom: var(--space-xxl);">
                    <h2 style="margin-bottom: var(--space-md);">A Revolutionary Fusion</h2>
                    <p style="color: var(--text-muted); line-height: 1.8; margin-bottom: var(--space-md);">
                        Varma's unique style was a groundbreaking fusion of Western techniques—such as perspective and chiaroscuro—with traditional Indian subjects and iconography. He was the first Indian artist to depict Hindu gods and goddesses with human-like features and emotional depth, dressed in traditional Indian attire.
                    </p>
                    <img src="images/varma_painting.png" alt="Varma Masterpiece" style="width: 100%; border-radius: 8px; box-shadow: var(--shadow-lg); margin: var(--space-lg) 0;">
                    <p style="color: var(--text-muted); line-height: 1.8;">
                        His paintings, such as <strong>"Hamsa Damayanti"</strong> and <strong>"Shakuntala"</strong>, brought the epics of the Ramayana and Mahabharata to life with a vibrancy and realism never seen before. These works didn't just capture stories; they captured the imagination of a nation.
                    </p>
                </div>

                <div style="margin-bottom: var(--space-xxl);">
                    <h2 style="margin-bottom: var(--space-md);">Democratizing Art: The Ravi Varma Press</h2>
                    <p style="color: var(--text-muted); line-height: 1.8; margin-bottom: var(--space-md);">
                        Perhaps his greatest contribution was his mission to make fine art accessible to the common man. In 1894, he established the <strong>Raja Ravi Varma Oleographic and Lithographic Press</strong> in Mumbai. By producing thousands of high-quality lithographs of his paintings, he ensured that his art could reach every household in India, regardless of status or wealth.
                    </p>
                    <p style="color: var(--text-muted); line-height: 1.8;">
                        This democratization of art profoundly influenced Indian popular culture and religious iconography, a legacy that continues to this day in calendars, posters, and films.
                    </p>
                </div>

                <div style="background: var(--bg-muted); padding: var(--space-xl); border-radius: 8px; border: 1px solid var(--border-color);">
                    <h2 style="margin-bottom: var(--space-md);">Legacy and Recognition</h2>
                    <p style="color: var(--text-muted); line-height: 1.8; margin-bottom: var(--space-md);">
                        Raja Ravi Varma passed away in 1906, but his impact remains immeasurable. In 1904, on behalf of King-Emperor Edward VII, the Viceroy Lord Curzon awarded him the <strong>Kaiser-i-Hind Gold Medal</strong>. Today, his paintings are considered national treasures, housed in prestigious galleries such as the National Gallery of Modern Art and the Laxmi Vilas Palace.
                    </p>
                    <p style="color: var(--text-muted); line-height: 1.8;">
                        AuraArt Gallery is proud to carry forward his legacy and his commitment to bringing the beauty of fine art into the modern home.
                    </p>
                </div>

                <div style="text-align: center; margin-top: var(--space-xxl);">
                    <button class="btn btn-primary" data-link="shop">Explore Our Collection</button>
                    <button class="btn" style="border: 1px solid var(--text-color); background: transparent; margin-left: 1rem;" data-link="home">Back to Home</button>
                </div>
            </div>
        </section>
    `
};

