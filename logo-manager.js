// Logo Management System for EstesPark.com
// Automatically loads and displays logos from directory structure

class LogoManager {
    constructor() {
        this.logoConfig = {
            lodging: [
                { name: 'stanley-hotel', alt: 'The Stanley Hotel' },
                { name: 'estes-park-resort', alt: 'The Estes Park Resort' },
                { name: 'lazy-r-cottages', alt: 'Lazy R Cottages' },
                { name: 'fawn-valley-inn', alt: 'Fawn Valley Inn' },
                { name: 'evergreens-fall-river', alt: 'The Evergreens on Fall River' }
            ],
            dining: [
                { name: 'cascades-restaurant', alt: 'Cascades Restaurant' },
                { name: 'nepals-cafe', alt: "Nepal's Cafe" },
                { name: 'penelopes-burgers', alt: "Penelope's Old Time Burgers" },
                { name: 'notchtop-bakery', alt: 'Notchtop Bakery & Cafe' },
                { name: 'taffy-shop', alt: 'The Taffy Shop' },
                { name: 'donut-haus', alt: 'Donut Haus' }
            ],
            attractions: [
                { name: 'rocky-mountain-np', alt: 'Rocky Mountain National Park' },
                { name: 'stanley-hotel-tours', alt: 'Stanley Hotel Tours' },
                { name: 'estes-park-brewery', alt: 'Estes Park Brewery' },
                { name: 'snowy-peaks-winery', alt: 'Snowy Peaks Winery' }
            ],
            sponsors: [
                { name: 'visit-estes-park', alt: 'Visit Estes Park' },
                { name: 'colorado-tourism', alt: 'Colorado Tourism Office' }
            ]
        };
        this.init();
    }

    init() {
        this.loadLogos();
        this.setupLazyLoading();
    }

    async loadLogos() {
        // Auto-detect and load logos from each category
        for (const [category, logos] of Object.entries(this.logoConfig)) {
            await this.loadCategoryLogos(category, logos);
        }
    }

    async loadCategoryLogos(category, logos) {
        const container = document.querySelector(`[data-logos="${category}"]`);
        if (!container) return;

        const logoGrid = document.createElement('div');
        logoGrid.className = 'logo-grid';

        for (const logo of logos) {
            const logoElement = await this.createLogoElement(category, logo);
            if (logoElement) {
                logoGrid.appendChild(logoElement);
            }
        }

        container.appendChild(logoGrid);
    }

    async createLogoElement(category, logo) {
        const logoDiv = document.createElement('div');
        logoDiv.className = 'logo-item';

        // Try multiple file formats
        const formats = ['svg', 'png', 'jpg', 'webp'];
        let logoSrc = null;

        for (const format of formats) {
            const testSrc = `images/${category}/${logo.name}.${format}`;
            if (await this.imageExists(testSrc)) {
                logoSrc = testSrc;
                break;
            }
        }

        if (logoSrc) {
            logoDiv.innerHTML = `
                <img src="${logoSrc}" 
                     alt="${logo.alt}" 
                     loading="lazy"
                     class="logo-image"
                     onerror="this.parentElement.style.display='none'">
            `;
            return logoDiv;
        }

        return null;
    }

    async imageExists(src) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = src;
        });
    }

    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const logoObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        logoObserver.unobserve(img);
                    }
                });
            });

            document.querySelectorAll('img.lazy').forEach(img => {
                logoObserver.observe(img);
            });
        }
    }

    // Method to add new logos dynamically
    addLogo(category, logoData) {
        if (!this.logoConfig[category]) {
            this.logoConfig[category] = [];
        }
        this.logoConfig[category].push(logoData);
        this.loadCategoryLogos(category, [logoData]);
    }

    // Method to bulk import logos from a directory
    async bulkImportLogos(category, fileList) {
        const logos = [];
        
        for (const file of fileList) {
            const name = file.name.split('.')[0];
            const alt = this.generateAltText(name);
            logos.push({ name, alt });
        }

        this.logoConfig[category] = logos;
        await this.loadCategoryLogos(category, logos);
    }

    generateAltText(filename) {
        return filename
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }
}

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.logoManager = new LogoManager();
});

// Utility function for drag-and-drop logo upload
function setupLogoDropZone() {
    const dropZones = document.querySelectorAll('[data-drop-zone]');
    
    dropZones.forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('drag-over');
        });

        zone.addEventListener('dragleave', () => {
            zone.classList.remove('drag-over');
        });

        zone.addEventListener('drop', async (e) => {
            e.preventDefault();
            zone.classList.remove('drag-over');
            
            const files = Array.from(e.dataTransfer.files);
            const category = zone.dataset.dropZone;
            
            await window.logoManager.bulkImportLogos(category, files);
        });
    });
}