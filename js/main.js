/**
 * Rosomat Store - Main JavaScript Engine
 * Dynamic CSV loading, multi-currency engine (YER, SAR, USD), instant search & filtering
 */

// Global App State
const AppState = {
  products: [],
  filteredProducts: [],
  selectedCategory: 'all',
  searchQuery: '',
  sortBy: 'default',
  currency: localStorage.getItem('rosomat_currency') || 'SAR',
  whatsappNumber: '966550463239', // Store WhatsApp phone number
  currencySymbols: {
    YER: 'ر.ي',
    SAR: 'ر.س',
    USD: '$'
  },
  currencyLabels: {
    YER: 'ريال يمني (YER)',
    SAR: 'ريال سعودي (SAR)',
    USD: 'دولار أمريكي (USD)'
  },
  // Approximate fallback rates relative to SAR if prices are missing
  exchangeRates: {
    SAR: 1,
    YER: 400,
    USD: 0.266
  }
};

// Embedded Fallback Products (Matches data/products.csv)
const FALLBACK_PRODUCTS = [
  {
    id: 1,
    title: "برمجة تطبيقات الاندرويد و IOS",
    slug: "Android-and-IOS-app-programming",
    price_yer: 0,
    price_sar: 0,
    price_usd: 0,
    category: "برمجة المواقع والتطبيقات",
    sku: "R3",
    image: "https://media.zid.store/cdn-cgi/image/fit=scale-down,width=500,height=500/https://media.zid.store/cdccfb2a-cf4a-40df-a8e8-308a199f021c/844045b5-542f-4f13-8c74-22c10bae9e74.png",
    badge: "يباع سريعًا",
    short_desc: "نقدم لك خبرتنا الواسعة في تطوير التطبيقات لنظامي التشغيل الأندرويد وiOS باستخدام أحدث التقنيات وأدوات التطوير المبتكرة.",
    options: [
      { name: "تصميم تطبيق للمنشأت التجارية الصغيرة", price_yer: 6000000, price_sar: 15000, price_usd: 4000 },
      { name: "تصميم تطبيق للمنشأت التجارية المتوسطة", price_yer: 10000000, price_sar: 25000, price_usd: 6660 },
      { name: "تصميم تطبيق للمنشأت التجارية الكبيرة", price_yer: 20000000, price_sar: 50000, price_usd: 13330 }
    ],
    url: "products/Android-and-IOS-app-programming.html"
  },
  {
    id: 2,
    title: "استخراج الداتا العملاء (الارقام)",
    slug: "extract-customer-phone-data",
    price_yer: 60000,
    price_sar: 150,
    price_usd: 40,
    category: "استخراج البيانات (داتا انتري)",
    sku: "R10",
    image: "https://media.zid.store/cdn-cgi/image/fit=scale-down,width=500,height=500/https://media.zid.store/cdccfb2a-cf4a-40df-a8e8-308a199f021c/ea716e10-befe-4a77-a7a8-e8ecf7172f6e.png",
    badge: "الأكثر طلباً",
    short_desc: "نوفر خدمة استخراج بيانات أرقام العملاء بدقة واحترافية مصنفة حسب النشاط والمدينة لزيادة مبيعاتك.",
    options: [
      { name: "1,000 رقم عميل مستهدف", price_yer: 60000, price_sar: 150, price_usd: 40 },
      { name: "5,000 رقم عميل مستهدف", price_yer: 200000, price_sar: 500, price_usd: 133 },
      { name: "10,000 رقم عميل مستهدف", price_yer: 360000, price_sar: 900, price_usd: 240 }
    ],
    url: "products/extract-customer-phone-data.html"
  },
  {
    id: 3,
    title: "تصميم المواقع الالكترونية للمنشآت التجارية",
    slug: "web-design-service",
    price_yer: 1000000,
    price_sar: 2500,
    price_usd: 665,
    category: "برمجة المواقع والتطبيقات",
    sku: "R4",
    image: "https://media.zid.store/cdn-cgi/image/fit=scale-down,width=500,height=500/https://media.zid.store/cdccfb2a-cf4a-40df-a8e8-308a199f021c/844045b5-542f-4f13-8c74-22c10bae9e74.png",
    badge: "عرض خاص",
    short_desc: "تصميم وتطوير موقع إلكتروني احترافي متجاوب مع جميع الأجهزة ومُهيأ لمحركات البحث وبلوحة تحكم سهلة.",
    options: [
      { name: "موقع صفحة هبوط تعريفية", price_yer: 1000000, price_sar: 2500, price_usd: 665 },
      { name: "موقع شركة متكامل (5-8 صفحات)", price_yer: 1800000, price_sar: 4500, price_usd: 1200 },
      { name: "متجر إلكتروني متكامل", price_yer: 3000000, price_sar: 7500, price_usd: 2000 }
    ],
    url: "products/web-design-service.html"
  }
];

// RFC 4180 Standard CSV Parser
function parseCSV(text) {
  const lines = [];
  let row = [];
  let inQuotes = false;
  let currentVal = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      row.push(currentVal.trim());
      if (row.some(val => val !== '')) lines.push(row);
      row = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }
  if (currentVal || row.length > 0) {
    row.push(currentVal.trim());
    if (row.some(val => val !== '')) lines.push(row);
  }

  if (lines.length < 2) return [];

  const headers = lines[0].map(h => h.toLowerCase().trim());
  const parsed = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i];
    const obj = {};
    headers.forEach((h, index) => {
      obj[h] = values[index] !== undefined ? values[index] : '';
    });

    let parsedOptions = [];
    if (obj.options) {
      try {
        parsedOptions = JSON.parse(obj.options);
      } catch (e) {
        parsedOptions = [];
      }
    }

    parsed.push({
      id: parseInt(obj.id) || i,
      title: obj.title || 'منتج بدون اسم',
      slug: obj.slug || `product-${i}`,
      price_yer: parseFloat(obj.price_yer) || (parseFloat(obj.price_sar) * AppState.exchangeRates.YER) || 0,
      price_sar: parseFloat(obj.price_sar) || 0,
      price_usd: parseFloat(obj.price_usd) || (parseFloat(obj.price_sar) * AppState.exchangeRates.USD) || 0,
      category: obj.category || 'عام',
      sku: obj.sku || `SKU-${i}`,
      image: obj.image || 'https://via.placeholder.com/500x500.png?text=Product',
      badge: obj.badge || '',
      short_desc: obj.short_desc || '',
      options: parsedOptions,
      url: obj.url || `products/${obj.slug}.html`
    });
  }

  return parsed;
}

// Load products from CSV with multi-source fallback (HTTP fetch -> localStorage -> offline script -> fallback list)
async function loadProductsData() {
  let csvText = null;

  // 1. Try to fetch data/products.csv directly (Works when hosted on GitHub Pages or local HTTP server)
  try {
    const response = await fetch('data/products.csv?v=' + Date.now());
    if (response.ok) {
      const text = await response.text();
      if (text && text.trim().length > 10) {
        csvText = text;
      }
    }
  } catch (err) {
    // Normal browser security restriction when opening via file:/// directly
  }

  // 2. Check localStorage (Updated dynamically whenever products are added/edited/deleted in admin.html)
  if (!csvText && localStorage.getItem('rosomat_products_csv')) {
    csvText = localStorage.getItem('rosomat_products_csv');
  }

  // 3. Check window.ROSOMAT_DEFAULT_CSV (Loaded from data/products-data.js for offline file:// execution)
  if (!csvText && window.ROSOMAT_DEFAULT_CSV) {
    csvText = window.ROSOMAT_DEFAULT_CSV;
  }

  // Parse if CSV content was retrieved from any source
  if (csvText) {
    const parsed = parseCSV(csvText);
    if (parsed && parsed.length > 0) {
      AppState.products = parsed;
      populateCategoryNav();
      applyFiltersAndRender();
      return;
    }
  }

  // 4. Default Fallback
  AppState.products = FALLBACK_PRODUCTS;
  populateCategoryNav();
  applyFiltersAndRender();
}

// Currency Formatting Helper (YER, SAR, USD)
function formatPrice(product, currency) {
  let val = 0;
  if (currency === 'YER') {
    val = product.price_yer !== undefined ? product.price_yer : (product.price_sar * AppState.exchangeRates.YER);
    val = Number(val);
    const formattedVal = Math.round(val).toLocaleString('en-US');
    return `${formattedVal} ر.ي`;
  } else if (currency === 'SAR') {
    val = Number(product.price_sar || 0);
    const formattedVal = val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${formattedVal} ر.س`;
  } else if (currency === 'USD') {
    val = product.price_usd !== undefined ? product.price_usd : (product.price_sar * AppState.exchangeRates.USD);
    val = Number(val);
    const formattedVal = val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `$${formattedVal}`;
  }

  return `${val} ر.س`;
}

// Populate Category Pills
function populateCategoryNav() {
  const container = document.getElementById('category-nav-list');
  if (!container) return;

  const categories = ['all', ...new Set(AppState.products.map(p => p.category).filter(Boolean))];

  container.innerHTML = categories.map(cat => {
    const label = cat === 'all' ? 'جميع المنتجات' : cat;
    const activeClass = AppState.selectedCategory === cat ? 'active' : '';
    return `<a class="category-link ${activeClass}" onclick="setCategory('${cat}')">${label}</a>`;
  }).join('');
}

function setCategory(cat) {
  AppState.selectedCategory = cat;
  populateCategoryNav();
  applyFiltersAndRender();
}

// Filter and Sort Engine
function applyFiltersAndRender() {
  let list = [...AppState.products];

  // Category filter
  if (AppState.selectedCategory && AppState.selectedCategory !== 'all') {
    list = list.filter(p => p.category === AppState.selectedCategory);
  }

  // Search filter
  if (AppState.searchQuery.trim()) {
    const q = AppState.searchQuery.toLowerCase().trim();
    list = list.filter(p => 
      p.title.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.short_desc && p.short_desc.toLowerCase().includes(q))
    );
  }

  // Sorting
  if (AppState.sortBy === 'price_low') {
    list.sort((a, b) => a.price_sar - b.price_sar);
  } else if (AppState.sortBy === 'price_high') {
    list.sort((a, b) => b.price_sar - a.price_sar);
  } else if (AppState.sortBy === 'latest') {
    list.sort((a, b) => b.id - a.id);
  }

  AppState.filteredProducts = list;
  renderProductsGrid(list);
}

// Render Products Grid
function renderProductsGrid(products) {
  const container = document.getElementById('products-grid-container');
  const countBadge = document.getElementById('products-count');
  const emptyNotice = document.getElementById('no-products-found');

  if (countBadge) countBadge.textContent = products.length;

  if (!container) return;

  if (products.length === 0) {
    container.innerHTML = '';
    if (emptyNotice) emptyNotice.style.display = 'block';
    return;
  }

  if (emptyNotice) emptyNotice.style.display = 'none';

  container.innerHTML = products.map(product => {
    const priceFormatted = formatPrice(product, AppState.currency);
    const hasOptions = product.options && product.options.length > 0;
    const badgeHtml = product.badge ? `
      <span class="badge-tag ${product.badge.includes('سريع') ? 'hot' : (product.badge.includes('عرض') ? 'sale' : '')}">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        ${product.badge}
      </span>
    ` : '';

    const optionsNoteHtml = hasOptions ? `
      <div class="card-options-note">
        <i class="ti ti-layers"></i> متوفر بعدة خيارات
      </div>
    ` : '';

    return `
      <div class="col">
        <div class="product-card">
          <div class="card-img-wrapper">
            ${badgeHtml}
            <a href="${product.url}" title="${product.title}">
              <img src="${product.image}" alt="${product.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/500x500.png?text=Rosomat';">
            </a>
          </div>
          <div class="card-body-content">
            <span class="card-category">${product.category}</span>
            <h3 class="card-title">
              <a href="${product.url}" title="${product.title}">${product.title}</a>
            </h3>
            ${optionsNoteHtml}
            <div class="card-price-section">
              <div class="card-price">${priceFormatted}</div>
            </div>
          </div>
          <div class="card-footer-btn">
            <a href="${product.url}" class="btn-card-view">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 8l4 4-4 4M8 12h8"></path>
              </svg>
              استعرض المنتج
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Currency Switcher (YER, SAR, USD)
function setCurrency(currency) {
  if (!['YER', 'SAR', 'USD'].includes(currency)) return;
  AppState.currency = currency;
  localStorage.setItem('rosomat_currency', currency);

  document.querySelectorAll('.current-currency-text').forEach(el => {
    el.textContent = AppState.currencyLabels[currency] || currency;
  });

  applyFiltersAndRender();

  const modalEl = document.getElementById('currencyModal');
  if (modalEl && window.bootstrap && bootstrap.Modal) {
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
  }
}

// Live Search Handlers
function setupSearchHandlers() {
  const headerSearchInput = document.getElementById('header-search-input');
  const pageSearchInput = document.getElementById('page-search-input');
  const dropdown = document.getElementById('search-dropdown');

  if (headerSearchInput && dropdown) {
    headerSearchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (!q) {
        dropdown.style.display = 'none';
        return;
      }

      const matches = AppState.products.filter(p => 
        p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
      ).slice(0, 6);

      if (matches.length > 0) {
        dropdown.innerHTML = matches.map(p => `
          <a href="${p.url}" class="search-result-item">
            <img src="${p.image}" alt="">
            <div>
              <div style="font-weight:700;font-size:0.92rem;color:#212529;">${p.title}</div>
              <small class="text-primary fw-bold">${formatPrice(p, AppState.currency)}</small>
            </div>
          </a>
        `).join('');
        dropdown.style.display = 'block';
      } else {
        dropdown.innerHTML = '<div class="p-3 text-muted text-center">لا توجد نتائج مطابقة لما تبحث عنه</div>';
        dropdown.style.display = 'block';
      }
    });

    document.addEventListener('click', (e) => {
      if (!headerSearchInput.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });
  }

  if (pageSearchInput) {
    pageSearchInput.addEventListener('input', (e) => {
      AppState.searchQuery = e.target.value;
      applyFiltersAndRender();
    });
  }
}

// Setup Sort Handlers
function setupSortHandlers() {
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      AppState.sortBy = e.target.value;
      applyFiltersAndRender();
    });
  }
}

// Setup Grid Range Slider
function setupGridSlider() {
  const slider = document.getElementById('grid-range-slider');
  const container = document.getElementById('products-grid-container');
  if (!slider || !container) return;

  slider.addEventListener('input', (e) => {
    const val = e.target.value;
    container.className = container.className.replace(/row-cols-\S+/g, '');
    container.classList.add(`row-cols-2`, `row-cols-md-3`, `row-cols-lg-${val}`);
  });
}

// Floating WhatsApp Link Setup
function setupWhatsAppFloat() {
  const link = document.getElementById('floating-whatsapp-link');
  if (link) {
    link.href = `https://wa.me/${AppState.whatsappNumber}?text=${encodeURIComponent('السلام عليكم، أود الاستفسار عن خدمات ومنتجات متجر رسومات الرقمية')}`;
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  setCurrency(AppState.currency);
  setupSearchHandlers();
  setupSortHandlers();
  setupGridSlider();
  setupWhatsAppFloat();
  loadProductsData();
});
