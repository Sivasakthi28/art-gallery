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
    const cp = (p) => window.appInstance ? window.appInstance.convertPrice(p) : p;
    const fp = (p) => window.appInstance ? window.appInstance.formatPrice(p) : `$${p}`;
    
    return `
    <div class="slider-slide" data-id="${art.id}" data-link="product" data-param="${art.id}">
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
    // Backward compatibility: use art.image if media array doesn't exist
    const previewMedia = (art.media && art.media.length > 0) ? art.media[0] : { type: 'image', url: art.image };
    
    const ratingData = window.appInstance ? window.appInstance.getRatingData(art.id) : { avg: 0, count: 0 };
    const stockStatus = art.stock === 0 
        ? '<span class="stock-badge stock-out">Out of Stock</span>'
        : art.stock < 5 
            ? `<span class="stock-badge stock-low">Only ${art.stock} left 🔥</span>`
            : '';

    return `
    <article class="product-card" data-id="${art.id}" data-link="product" data-param="${art.id}">
        <div class="wishlist-btn ${isWishlisted ? 'active' : ''}" onclick="event.stopPropagation(); window.toggleWishlist('${art.id}')">
            ${isWishlisted ? '❤️' : '🤍'}
        </div>
        <div class="product-image-container">
            ${art.media && art.media[0] && art.media[0].type === 'video' 
                ? `<video src="${art.media[0].url}" class="product-image ${art.needsRotation ? 'rotate-90' : ''}" muted loop onmouseover="this.play()" onmouseout="this.pause(); this.currentTime=0;"></video>` 
                : `<img src="${art.image}" alt="${art.title}" class="product-image ${art.needsRotation ? 'rotate-90' : ''}" loading="lazy">`
            }
            ${art.stock === 0 ? '<div class="out-of-stock-overlay">SOLD OUT</div>' : ''}
            <button class="quick-add btn-primary" onclick="event.stopPropagation(); ${art.stock > 0 ? `window.appInstance.addToCart('${art.id}')` : 'return false;'}">
                ${art.stock > 0 ? 'Add to Cart' : 'Unavailable'}
            </button>
        </div>
        <div class="product-info">
            <h3 class="product-title">${art.title}</h3>
            <p class="product-artist">${art.artist}</p>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 5px;">
                <p class="product-price">${fp(cp(art.price))}</p>
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
                    ${getFeaturedArtworks().map(renderSliderCard).join('')}
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
                    <p style="color: var(--text-muted); margin-bottom: var(--space-md); line-height: 1.6;">Raja Ravi Varma (1848–1906) was a legendary Indian painter who revolutionized Indian art by fusing European academic techniques with purely Indian sensibilities. At Varma Gallery, we draw inspiration from his pioneering spirit of making fine art accessible to all.</p>
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
                <div class="filters" style="display: flex; flex-wrap: wrap; gap: var(--space-md);">
                    <select class="filter-select" id="filter-type">
                        <option value="all">${t('allMediums')}</option>
                        <option value="painting">Paintings</option>
                        <option value="sketch">Sketches</option>
                        <option value="digital">Digital Art</option>
                        <option value="photography">Photography</option>
                        <option value="sculpture">Sculptures</option>
                    </select>
                    <select class="filter-select" id="filter-price">
                        <option value="all">${t('allPrices')}</option>
                        <option value="under500">Under $500</option>
                        <option value="500to1000">$500 - $1000</option>
                        <option value="over1000">Over $1000</option>
                    </select>
                </div>
                <div class="sort">
                    <select class="filter-select" id="sort-by">
                        <option value="featured">${t('sortBy')}: ${t('featured')}</option>
                        <option value="price-low">${t('lowToHigh')}</option>
                        <option value="price-high">${t('highToHigh')}</option>
                    </select>
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
        const medium = art.medium || art.category || "Mixed Media";
        const dimensions = art.size || art.dimensions || '24" x 36" (Standard)';
        const orientation = art.orientation || "Portrait / Landscape";
        const description = art.description || `An exquisite ${medium.toLowerCase()} piece by ${art.artist}. This artwork captures the essence of contemporary aesthetics and emotion, making it a perfect centerpiece for any modern space.`;
        const media = (art.media && art.media.length > 0) ? art.media : [{ type: 'image', url: art.image }];

        return `
        <section class="container section-padding" style="padding-top: 120px;">
            <div class="product-detail-grid">
                <div class="product-gallery" style="display: flex; gap: 20px;">
                    <div class="thumbnail-strip" style="display: flex; flex-direction: column; gap: 12px; max-height: 500px; overflow-y: auto; padding-right: 5px;">
                        ${media.map((item, index) => `
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
                            <div class="zoom-container" onclick="window.appInstance.openFullscreen('${media[0].url}')">
                                <img src="${media[0].url}" alt="${art.title}" class="zoom-image ${art.needsRotation ? 'rotate-90' : ''}" style="height: 100%; width: 100%; object-fit: contain; transform: ${art.needsRotation ? 'rotate(90deg)' : 'none'};">
                                <div class="zoom-hint">Roll over to zoom | Click for full view</div>
                            </div>
                            `
                        }
                    </div>
                </div>
                <div class="product-details" style="padding-top: var(--space-md);">
                    <h1 style="font-size: 3rem; margin-bottom: var(--space-sm);">${art.title}</h1>
                    <p style="font-size: 1.2rem; color: var(--text-muted); margin-bottom: var(--space-lg);">by ${art.artist}</p>
                    <p style="font-size: 1.8rem; font-weight: 500; margin-bottom: var(--space-lg);">${fp(cp(art.price))}</p>
                    
                    <p class="product-description" style="margin-bottom: var(--space-lg); line-height: 1.6; color: var(--text-color);">
                        ${t('description')}: Experience the timeless beauty of <strong>${art.title}</strong> by the legendary <strong>${art.artist}</strong>. This masterwork is a testament to the artist's unique vision and technical prowess.
                    </p>

                    <!-- Frame Selection -->
                    <div class="frame-selector">
                        <span class="frame-selector-label">Choose Frame</span>
                        <div class="frame-options">
                            <div class="frame-opt active" data-frame="none" onclick="window.appInstance.selectFrame('none')">
                                <div class="frame-preview preview-none"></div>
                                <span class="frame-name">No Frame</span>
                            </div>
                            <div class="frame-opt" data-frame="brown" onclick="window.appInstance.selectFrame('brown')">
                                <div class="frame-preview preview-brown"></div>
                                <span class="frame-name">Brown Frame</span>
                            </div>
                            <div class="frame-opt" data-frame="gold" onclick="window.appInstance.selectFrame('gold')">
                                <div class="frame-preview preview-gold"></div>
                                <span class="frame-name">Golden Frame</span>
                            </div>
                        </div>
                    </div>

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
                                onclick="window.appInstance.addToCart('${art.id}', window.currentFrame || 'none')"
                                ${art.stock === 0 ? 'disabled style="background: #ccc; cursor: not-allowed;"' : ''}>
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                            ${art.stock === 0 ? t('outOfStock') : t('addToCart')}
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
                            reviews.filter(r => r.productId === id).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map(review => `
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
                    ${items.map(item => `
                        <div style="display: flex; gap: var(--space-md); border-bottom: 1px solid var(--border-color); padding-bottom: var(--space-md); margin-bottom: var(--space-md);">
                            <img src="${item.image}" alt="${item.title}" style="width: 100px; height: 100px; object-fit: cover;">
                            <div style="flex: 1;">
                                <h3 style="font-size: 1.2rem; margin-bottom: 0.2rem;">${item.title}</h3>
                                <p style="color: var(--text-muted); font-size: 0.9rem;">${item.artist}</p>
                                ${item.frame && item.frame !== 'none' ? `<p style="color: var(--accent-color); font-size: 0.8rem; margin-top: 5px; font-weight: 500;">Frame: ${item.frame.charAt(0).toUpperCase() + item.frame.slice(1)}</p>` : ''}
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
                        ${cart.items.map(item => `
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
                ${items.map(item => `
                    <article class="product-card" style="position: relative;">
                        <div class="wishlist-btn active" onclick="window.removeFromWishlist('${item.id}')">
                            ❤️
                        </div>
                        <div class="product-image-container">
                            <img src="${item.image}" alt="${item.title}" class="product-image" loading="lazy">
                        </div>
                        <div class="product-info">
                            <h3 class="product-title">${item.title}</h3>
                            <p class="product-artist">${item.artist}</p>
                            <p class="product-price">$${item.price.toLocaleString()}</p>
                            <button class="btn btn-primary" onclick="window.moveToCart('${item.id}')" style="width: 100%; margin-top: 1rem;">Move to Cart</button>
                        </div>
                    </article>
                `).join('')}
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
                            <label style="font-size: 0.8rem; color: var(--text-muted);">Media URLs (Images/Videos - Max 9)</label>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                <input type="url" class="prod-media" placeholder="Media 1 (Primary)" required style="padding: 10px; border: 1px solid var(--border-color); grid-column: 1 / -1;">
                                <input type="url" class="prod-media" placeholder="Media 2" style="padding: 10px; border: 1px solid var(--border-color);">
                                <input type="url" class="prod-media" placeholder="Media 3" style="padding: 10px; border: 1px solid var(--border-color);">
                                <input type="url" class="prod-media" placeholder="Media 4" style="padding: 10px; border: 1px solid var(--border-color);">
                                <input type="url" class="prod-media" placeholder="Media 5" style="padding: 10px; border: 1px solid var(--border-color);">
                                <input type="url" class="prod-media" placeholder="Media 6" style="padding: 10px; border: 1px solid var(--border-color);">
                                <input type="url" class="prod-media" placeholder="Media 7" style="padding: 10px; border: 1px solid var(--border-color);">
                                <input type="url" class="prod-media" placeholder="Media 8" style="padding: 10px; border: 1px solid var(--border-color);">
                                <input type="url" class="prod-media" placeholder="Media 9" style="padding: 10px; border: 1px solid var(--border-color);">
                            </div>
                        </div>
                        <input type="number" id="prod-stock" placeholder="Stock Quantity" required min="1" value="1" style="padding: 10px; border: 1px solid var(--border-color);">
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
                <button class="btn" style="background: #333; color: white;" onclick="window.appInstance.downloadInvoice()">Download Invoice (Varma Gallery)</button>
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
                        Varma Gallery is proud to carry forward his name and his commitment to bringing the beauty of fine art into the modern home.
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
