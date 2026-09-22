/**
 * Rosomat Admin Dashboard JS Engine
 * Handles Product HTML generation, CSV management, and file downloads
 * Supported Currencies: YER (ريال يمني), SAR (ريال سعودي), USD (دولار أمريكي)
 */

let currentProductsList = [];
let lastGeneratedHtml = '';
let lastGeneratedSlug = '';
let lastGeneratedCsvRow = '';

// Default Fallback Products (Matches data/products.csv)
const INITIAL_PRODUCTS = [
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

// RFC 4180 CSV Parser
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
    headers.forEach((h, idx) => {
      obj[h] = values[idx] !== undefined ? values[idx] : '';
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
      title: obj.title || '',
      slug: obj.slug || `product-${i}`,
      price_yer: parseFloat(obj.price_yer) || 0,
      price_sar: parseFloat(obj.price_sar) || 0,
      price_usd: parseFloat(obj.price_usd) || 0,
      category: obj.category || '',
      sku: obj.sku || '',
      image: obj.image || '',
      badge: obj.badge || '',
      short_desc: obj.short_desc || '',
      options: parsedOptions,
      url: obj.url || `products/${obj.slug}.html`
    });
  }

  return parsed;
}

// Convert current products list to valid CSV string
function exportToCSV(products) {
  const headers = ['id', 'title', 'slug', 'price_yer', 'price_sar', 'price_usd', 'category', 'sku', 'image', 'badge', 'short_desc', 'options', 'url'];
  const rows = [headers.join(',')];

  products.forEach(p => {
    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const row = [
      p.id,
      escapeCsv(p.title),
      escapeCsv(p.slug),
      p.price_yer,
      p.price_sar,
      p.price_usd,
      escapeCsv(p.category),
      escapeCsv(p.sku),
      escapeCsv(p.image),
      escapeCsv(p.badge),
      escapeCsv(p.short_desc),
      escapeCsv(JSON.stringify(p.options || [])),
      escapeCsv(p.url || `products/${p.slug}.html`)
    ];

    rows.push(row.join(','));
  });

  return rows.join('\n');
}

// Auto Slugifier
function autoGenerateSlug(title) {
  const slugInput = document.getElementById('p-slug');
  const slugHint = document.getElementById('slug-hint');
  const titlePreview = document.getElementById('card-preview-title');
  if (titlePreview) titlePreview.textContent = title || 'عنوان المنتج';

  if (!slugInput) return;
  let clean = title.trim().toLowerCase()
    .replace(/[^\u0621-\u064A\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!clean) clean = 'new-product-' + Date.now();
  slugInput.value = clean;
  if (slugHint) slugHint.textContent = clean;
}

// Auto Currencies Calculator from SAR
function autoCalculateCurrencies(valSar) {
  const sar = parseFloat(valSar) || 0;
  const yerInput = document.getElementById('p-price-yer');
  const usdInput = document.getElementById('p-price-usd');
  const pricePreview = document.getElementById('card-preview-price');

  if (yerInput) yerInput.value = Math.round(sar * 400);
  if (usdInput) usdInput.value = (sar * 0.266).toFixed(2);
  if (pricePreview) pricePreview.textContent = `${sar.toLocaleString('en-US', {minimumFractionDigits:2})} ر.س`;
}

// Dynamic Options Row in Admin
let optionCount = 0;
function addOptionRow(name = '', yer = '', sar = '', usd = '') {
  optionCount++;
  const container = document.getElementById('options-container');
  if (!container) return;

  const row = document.createElement('div');
  row.className = 'row g-2 align-items-center p-2 bg-white rounded border option-item';
  row.id = `option-row-${optionCount}`;
  row.innerHTML = `
    <div class="col-md-4">
      <input type="text" class="form-control form-control-sm opt-name" placeholder="اسم الخيار (مثال: الباقة المتوسطة)" value="${name}" required>
    </div>
    <div class="col-md-3">
      <input type="number" step="any" min="0" class="form-control form-control-sm opt-yer" placeholder="السعر (ر.ي)" value="${yer}" required>
    </div>
    <div class="col-md-2">
      <input type="number" step="any" min="0" class="form-control form-control-sm opt-sar" placeholder="السعر (ر.س)" value="${sar}" oninput="this.parentElement.previousElementSibling.children[0].value=Math.round(this.value*400); this.parentElement.nextElementSibling.children[0].value=(this.value*0.266).toFixed(2);" required>
    </div>
    <div class="col-md-2">
      <input type="number" step="any" min="0" class="form-control form-control-sm opt-usd" placeholder="السعر ($)" value="${usd}" required>
    </div>
    <div class="col-md-1 text-center">
      <button type="button" class="btn btn-outline-danger btn-sm p-1" onclick="document.getElementById('option-row-${optionCount}').remove();" title="حذف الخيار">
        <i class="ti ti-trash"></i>
      </button>
    </div>
  `;
  container.appendChild(row);
}

// Helper to populate default guarantee text in admin form
function insertDefaultGuarantee() {
  const gInput = document.getElementById('p-guarantee-desc');
  if (gInput) {
    gInput.value = 
`- تسليم الخدمة بأعلى جودة واحترافية وفق الجدول الزمني المتفق عليه.
- دعم فني وتعديلات مجانية لضمان رضاكم التام بنسبة 100%.
- فواتير وسندات رسمية موثوقة لكافة الخدمات المقدمة.`;
  }
}

// Main Form Submission: Generate Standalone HTML Product Code
function handleGenerateProduct(event) {
  event.preventDefault();

  const title = document.getElementById('p-title').value.trim();
  const slug = document.getElementById('p-slug').value.trim() || 'product-' + Date.now();
  const category = document.getElementById('p-category').value.trim() || 'عام';
  const sku = document.getElementById('p-sku').value.trim() || 'R' + Math.floor(Math.random() * 90 + 10);
  const price_sar = parseFloat(document.getElementById('p-price-sar').value) || 0;
  const price_yer = parseFloat(document.getElementById('p-price-yer').value) || Math.round(price_sar * 400);
  const price_usd = parseFloat(document.getElementById('p-price-usd').value) || (price_sar * 0.266);
  const image = document.getElementById('p-image').value.trim() || 'https://via.placeholder.com/500x500.png?text=Rosomat';
  const badge = document.getElementById('p-badge').value;
  const short_desc = document.getElementById('p-short-desc').value.trim();
  const full_desc = document.getElementById('p-full-desc').value.trim() || `<p>${short_desc}</p>`;
  const guarantee_desc = document.getElementById('p-guarantee-desc') ? document.getElementById('p-guarantee-desc').value.trim() : '';
  const whatsapp = document.getElementById('p-whatsapp').value.trim() || '966550463239';

  // Collect options
  const options = [];
  document.querySelectorAll('#options-container .option-item').forEach(row => {
    const name = row.querySelector('.opt-name').value.trim();
    const yer = parseFloat(row.querySelector('.opt-yer').value) || 0;
    const sar = parseFloat(row.querySelector('.opt-sar').value) || 0;
    const usd = parseFloat(row.querySelector('.opt-usd').value) || 0;
    if (name) {
      options.push({ name, price_yer: yer, price_sar: sar, price_usd: usd });
    }
  });

  // If no options provided, provide default base option
  if (options.length === 0) {
    options.push({ name: 'الطلب الأساسي', price_yer, price_sar, price_usd });
  }

  // Generate the HTML code for this product
  lastGeneratedSlug = slug;
  lastGeneratedHtml = generateStandaloneProductHtml({
    title, slug, category, sku, price_yer, price_sar, price_usd, image, badge, short_desc, full_desc, guarantee: guarantee_desc, whatsapp, options
  });

  // Display Generated Code
  document.getElementById('download-filename').textContent = `${slug}.html`;
  document.getElementById('code-preview-content').textContent = lastGeneratedHtml;
  document.getElementById('generated-output-card').style.display = 'block';
  document.getElementById('generated-output-card').scrollIntoView({ behavior: 'smooth' });

  // Create Product Object & Append to CSV list
  const nextId = currentProductsList.length > 0 ? Math.max(...currentProductsList.map(p => p.id)) + 1 : 1;
  const newProductObj = {
    id: nextId,
    title,
    slug,
    price_yer,
    price_sar,
    price_usd,
    category,
    sku,
    image,
    badge,
    short_desc,
    options,
    url: `products/${slug}.html`
  };

  // Check if product with same slug already exists, update or add
  const existingIndex = currentProductsList.findIndex(p => p.slug === slug);
  if (existingIndex >= 0) {
    currentProductsList[existingIndex] = newProductObj;
  } else {
    currentProductsList.push(newProductObj);
  }

  // Update CSV display row
  const escapeCsv = (str) => `"${String(str || '').replace(/"/g, '""')}"`;
  lastGeneratedCsvRow = [
    newProductObj.id,
    escapeCsv(newProductObj.title),
    escapeCsv(newProductObj.slug),
    newProductObj.price_yer,
    newProductObj.price_sar,
    newProductObj.price_usd,
    escapeCsv(newProductObj.category),
    escapeCsv(newProductObj.sku),
    escapeCsv(newProductObj.image),
    escapeCsv(newProductObj.badge),
    escapeCsv(newProductObj.short_desc),
    escapeCsv(JSON.stringify(newProductObj.options)),
    escapeCsv(newProductObj.url)
  ].join(',');

  document.getElementById('csv-row-display').textContent = lastGeneratedCsvRow;

  // Persist to localStorage for immediate sync with index.html (especially when opened via file://)
  try {
    localStorage.setItem('rosomat_products_csv', exportToCSV(currentProductsList));
  } catch (e) {
    console.warn('localStorage save failed', e);
  }

  // Refresh CSV Table
  renderCsvTable();
}

// Standalone Product HTML Generator Function
function generateStandaloneProductHtml(data) {
  const optionsHtml = data.options.map((opt, idx) => `
                <option value="${idx}" data-price-yer="${opt.price_yer}" data-price-sar="${opt.price_sar}" data-price-usd="${opt.price_usd}" ${idx === 0 ? 'selected' : ''}>
                  ${opt.name} (+${opt.price_sar.toLocaleString('en-US', {minimumFractionDigits:2})} ر.س)
                </option>`).join('');

  const optionsJson = JSON.stringify(data.options, null, 2);

  // Guarantee HTML generation: use custom input if provided, otherwise default
  let guaranteeHtml = '';
  if (data.guarantee && data.guarantee.trim()) {
    if (data.guarantee.includes('<') && data.guarantee.includes('>')) {
      guaranteeHtml = data.guarantee;
    } else {
      const items = data.guarantee.split('\n').map(l => l.replace(/^[-*•]\s*/, '').trim()).filter(Boolean);
      guaranteeHtml = `
              <ul class="text-muted d-flex flex-column gap-2 p-0 pe-3">
                ${items.map(item => `<li>${item}</li>`).join('\n                ')}
              </ul>`;
    }
  } else {
    guaranteeHtml = `
              <ul class="text-muted d-flex flex-column gap-2 p-0 pe-3">
                <li>تسليم الخدمة بأعلى جودة واحترافية وفق الجدول الزمني المتفق عليه.</li>
                <li>دعم فني وتعديلات مجانية لضمان رضاكم التام بنسبة 100%.</li>
                <li>فواتير وسندات رسمية موثوقة لكافة الخدمات المقدمة.</li>
              </ul>`;
  }

  return `<!doctype html>
<html lang="ar" dir="rtl" class="h-100">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${data.title} - اطلب الآن | رسومات الرقمية</title>
  <meta name="description" content="${data.short_desc}">
  
  <link rel="icon" href="https://media.zid.store/cdccfb2a-cf4a-40df-a8e8-308a199f021c/8dce714f-9120-4a65-9638-e792d4561cf0-32x32.png" type="image/x-icon">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.rtl.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css">
  <link rel="stylesheet" href="../css/style.css">
</head>
<body class="d-flex flex-column h-100">

  <!-- Top Announcement -->
  <div class="announcement-bar" id="announcementBar">
    <div class="container d-flex justify-content-between align-items-center">
      <div class="flex-grow-1 text-center">
        <span>حكايتنا لم تنتهي بعد 🚀 | عروض حصرية على باقات رسومات الرقمية</span>
      </div>
      <span class="ti ti-x close-announcement fs-5" onclick="document.getElementById('announcementBar').style.display='none';"></span>
    </div>
  </div>

  <!-- Header Navigation -->
  <header class="navbar-main sticky-top">
    <div class="container d-flex justify-content-between align-items-center gap-3">
      <a class="navbar-brand m-0" href="../index.html">
        <img src="https://media.zid.store/cdn-cgi/image/w=200,q=100/https://media.zid.store/cdccfb2a-cf4a-40df-a8e8-308a199f021c/404f05f8-2200-41f2-9848-4dcc76f08971-200x.png" alt="رسومات الرقمية">
        <span>رسومات الرقمية</span>
      </a>

      <a href="../index.html" class="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1">
        <i class="ti ti-arrow-right"></i>
        <span>العودة للمتجر</span>
      </a>

      <div class="d-flex align-items-center gap-2">
        <button type="button" class="currency-badge" data-bs-toggle="modal" data-bs-target="#currencyModal">
          <i class="ti ti-coin"></i>
          <span class="current-currency-text">ريال سعودي (SAR)</span>
        </button>
        <a href="https://wa.me/${data.whatsapp}" target="_blank" class="nav-action-btn" title="تواصل عبر الواتساب">
          <i class="ti ti-brand-whatsapp fs-5 text-success"></i>
        </a>
      </div>
    </div>
  </header>

  <!-- Breadcrumb -->
  <div class="bg-light border-bottom">
    <div class="container product-breadcrumb">
      <a href="../index.html">الرئيسية</a>
      <span class="mx-2 text-muted">/</span>
      <a href="../index.html">${data.category}</a>
      <span class="mx-2 text-muted">/</span>
      <span class="text-primary fw-bold">${data.title}</span>
    </div>
  </div>

  <!-- Product Details Section -->
  <main class="product-details-container flex-grow-1">
    <div class="container">
      <div class="row g-4 align-items-start">
        
        <!-- Right Column: Product Image Gallery -->
        <div class="col-12 col-lg-6 order-0 order-lg-1">
          <div class="product-gallery-box shadow-sm sticky-lg-top">
            ${data.badge ? `<span class="badge-tag hot" style="top: 18px; right: 18px; font-size: 0.85rem;"><i class="ti ti-star"></i> ${data.badge}</span>` : ''}
            <img src="${data.image}" alt="${data.title}" onerror="this.src='https://via.placeholder.com/500x500.png?text=Rosomat';">
          </div>
        </div>

        <!-- Left Column: Product Information & Order Actions -->
        <div class="col-12 col-lg-6 order-1 order-lg-0">
          <div class="product-meta-card">
            
            <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
              <h1 class="product-page-title m-0">${data.title}</h1>
            </div>

            <!-- SKU & Category -->
            <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
              <span class="product-sku-badge">
                <i class="ti ti-barcode"></i> رمز المنتج: <strong>${data.sku}</strong>
              </span>
              <span class="badge bg-light text-muted border">
                <i class="ti ti-tag text-primary"></i> ${data.category}
              </span>
            </div>

            <!-- Price Display Card -->
            <div class="product-price-box">
              <div>
                <div class="small text-muted fw-bold mb-1">السعر المعتمد:</div>
                <div class="product-price-main" id="dynamic-product-price">${data.price_sar.toLocaleString('en-US', {minimumFractionDigits:2})} ر.س</div>
              </div>
              <div class="text-end">
                <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 rounded-pill">
                  <i class="ti ti-check"></i> متاح للطلب الفوري
                </span>
              </div>
            </div>

            <!-- Brief Description -->
            <div class="card bg-light border-0 p-3 mb-4 rounded-3">
              <h6 class="fw-bold mb-2 text-dark"><i class="ti ti-info-circle text-primary me-1"></i> وصف مختصر للخدمة:</h6>
              <p class="text-muted small m-0 leading-relaxed">${data.short_desc}</p>
            </div>

            <!-- Options Selection Dropdown -->
            <div class="options-dropdown-group">
              <label for="product-option-select">
                <i class="ti ti-adjustments text-primary me-1"></i> اختر باقة أو خيار الخدمة:
              </label>
              <select id="product-option-select" class="form-select form-select-lg">
                ${optionsHtml}
              </select>
            </div>

            <!-- Quantity & WhatsApp Action -->
            <div class="row g-3 align-items-center mb-3">
              <div class="col-auto">
                <div class="quantity-control">
                  <button type="button" class="quantity-btn" onclick="updateQuantity(-1)"><i class="ti ti-minus"></i></button>
                  <input type="text" id="product-quantity-input" class="quantity-input" value="1" readonly>
                  <button type="button" class="quantity-btn" onclick="updateQuantity(1)"><i class="ti ti-plus"></i></button>
                </div>
              </div>
              <div class="col">
                <a id="btn-submit-order-whatsapp" href="#" target="_blank" class="btn-whatsapp-order">
                  <i class="ti ti-brand-whatsapp fs-4"></i>
                  <span>اطلب الآن عبر الواتساب</span>
                </a>
              </div>
            </div>

            <!-- Inquire Secondary Button -->
            <a id="btn-inquire-whatsapp" href="#" target="_blank" class="btn-whatsapp-inquire">
              <i class="ti ti-message-dots text-primary"></i>
              <span>لديك استفسار قبل الطلب؟ تحدث معنا مباشرة</span>
            </a>

            <!-- Payment Badges -->
            <div class="payment-methods-row">
              <span class="small text-muted fw-bold me-2">طرق الدفع المتوفرة:</span>
              <span class="payment-badge"><img src="https://media.zid.store/static/apple_pay.svg" alt="Apple Pay"></span>
              <span class="payment-badge"><img src="https://media.zid.store/static/mada-circle.png" alt="مدى"></span>
              <span class="payment-badge"><img src="https://media.zid.store/static/visa-circle.png" alt="Visa"></span>
              <span class="payment-badge"><img src="https://media.zid.store/static/mastercard-circle.png" alt="Mastercard"></span>
              <span class="payment-badge"><img src="https://media.zid.store/static/bankTransfer.png" alt="تحويل بنكي"></span>
            </div>

          </div>
        </div>

      </div>

      <!-- Lower Tabs Section -->
      <div class="product-tabs-wrapper">
        <ul class="nav nav-tabs" id="productDetailTabs" role="tablist">
          <li class="nav-item">
            <button class="nav-link active" id="details-tab" data-bs-toggle="tab" data-bs-target="#details-content" type="button">
              <i class="ti ti-list-details me-1"></i> تفاصيل ومميزات الخدمة
            </button>
          </li>
          <li class="nav-item">
            <button class="nav-link" id="guarantee-tab" data-bs-toggle="tab" data-bs-target="#guarantee-content" type="button">
              <i class="ti ti-shield-check me-1"></i> الضمان والدعم الفني
            </button>
          </li>
        </ul>

        <div class="tab-content shadow-sm" id="productDetailTabsContent">
          <div class="tab-pane fade show active" id="details-content">
            <div class="p-2 leading-relaxed">
              ${data.full_desc}
            </div>
          </div>
          <div class="tab-pane fade" id="guarantee-content">
            <div class="p-2">
              <h5 class="fw-bold text-primary mb-3">ضمان رسومات الرقمية</h5>
              ${guaranteeHtml}
            </div>
          </div>
        </div>
      </div>

    </div>
  </main>

  <!-- Currency Modal (YER, SAR, USD) -->
  <div class="modal fade" id="currencyModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title"><i class="ti ti-coins text-primary"></i> اختيار عملة العرض</h5>
          <button type="button" class="btn-close m-0" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body p-4">
          <div class="list-group gap-2">
            <button type="button" class="list-group-item list-group-item-action d-flex justify-content-between p-3 rounded" onclick="changeCurrency('YER')">
              <span class="fw-bold"><i class="ti ti-cash text-success fs-5 me-2"></i> ريال يمني (YER)</span>
              <span class="badge bg-primary bg-opacity-10 text-primary">ر.ي</span>
            </button>
            <button type="button" class="list-group-item list-group-item-action d-flex justify-content-between p-3 rounded" onclick="changeCurrency('SAR')">
              <span class="fw-bold"><i class="ti ti-cash text-success fs-5 me-2"></i> ريال سعودي (SAR)</span>
              <span class="badge bg-primary bg-opacity-10 text-primary">ر.س</span>
            </button>
            <button type="button" class="list-group-item list-group-item-action d-flex justify-content-between p-3 rounded" onclick="changeCurrency('USD')">
              <span class="fw-bold"><i class="ti ti-currency-dollar text-success fs-5 me-2"></i> دولار أمريكي (USD)</span>
              <span class="badge bg-primary bg-opacity-10 text-primary">$</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Floating WhatsApp -->
  <a id="floating-whatsapp-link" href="https://wa.me/${data.whatsapp}" target="_blank" class="floating-whatsapp">
    <div class="floating-whatsapp-text">راسلنا على الواتساب 👋</div>
    <div class="floating-whatsapp-btn"><i class="ti ti-brand-whatsapp"></i></div>
  </a>

  <!-- Footer -->
  <footer class="footer-main">
    <div class="container text-center py-3 border-top">
      <div class="text-muted small">جميع الحقوق محفوظة © 2026 رسومات الرقمية</div>
    </div>
  </footer>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script>
    const ProductConfig = {
      title: ${JSON.stringify(data.title)},
      sku: ${JSON.stringify(data.sku)},
      whatsappNumber: ${JSON.stringify(data.whatsapp)},
      currentCurrency: localStorage.getItem('rosomat_currency') || 'SAR',
      quantity: 1,
      options: ${optionsJson}
    };

    function getCurrentOption() {
      const select = document.getElementById('product-option-select');
      const idx = parseInt(select.value) || 0;
      return ProductConfig.options[idx] || ProductConfig.options[0];
    }

    function calculateTotalPrice() {
      const opt = getCurrentOption();
      let unitPrice = 0;
      if (ProductConfig.currentCurrency === 'YER') unitPrice = opt.price_yer;
      else if (ProductConfig.currentCurrency === 'USD') unitPrice = opt.price_usd;
      else unitPrice = opt.price_sar;
      return unitPrice * ProductConfig.quantity;
    }

    function formatCurrency(amount, currency) {
      const formatted = Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      if (currency === 'USD') return '$' + formatted;
      if (currency === 'YER') return formatted + ' ر.ي';
      return formatted + ' ر.س';
    }

    function updateProductUI() {
      const total = calculateTotalPrice();
      document.getElementById('dynamic-product-price').textContent = formatCurrency(total, ProductConfig.currentCurrency);

      document.querySelectorAll('.current-currency-text').forEach(el => {
        el.textContent = ProductConfig.currentCurrency === 'YER' ? 'ريال يمني (YER)' : (ProductConfig.currentCurrency === 'USD' ? 'دولار أمريكي (USD)' : 'ريال سعودي (SAR)');
      });

      const select = document.getElementById('product-option-select');
      Array.from(select.options).forEach((optEl, i) => {
        const item = ProductConfig.options[i];
        if (item) {
          let p = item.price_sar;
          if (ProductConfig.currentCurrency === 'YER') p = item.price_yer;
          else if (ProductConfig.currentCurrency === 'USD') p = item.price_usd;
          optEl.text = item.name + ' (+' + formatCurrency(p, ProductConfig.currentCurrency) + ')';
        }
      });

      updateWhatsAppLinks();
    }

    function updateWhatsAppLinks() {
      const opt = getCurrentOption();
      const total = calculateTotalPrice();
      const formattedPrice = formatCurrency(total, ProductConfig.currentCurrency);
      const pageUrl = window.location.href;

      const orderMessage = 
'مرحباً رسومات الرقمية 👋\\n' +
'أود طلب الخدمة التالية:\\n' +
'------------------------\\n' +
'📌 المنتج: ' + ProductConfig.title + '\\n' +
'🏷️ رمز المنتج (SKU): ' + ProductConfig.sku + '\\n' +
'⚙️ الخيار المطلوب: ' + opt.name + '\\n' +
'🔢 الكمية: ' + ProductConfig.quantity + '\\n' +
'💰 السعر الإجمالي: ' + formattedPrice + '\\n' +
'🔗 رابط الصفحة: ' + pageUrl + '\\n' +
'------------------------\\n' +
'أرجو تزويدي بتفاصيل تأكيد الطلب وخطوات البدء. شكراً لكم!';

      const orderBtn = document.getElementById('btn-submit-order-whatsapp');
      if (orderBtn) {
        orderBtn.href = 'https://wa.me/' + ProductConfig.whatsappNumber + '?text=' + encodeURIComponent(orderMessage);
      }

      const inquireBtn = document.getElementById('btn-inquire-whatsapp');
      if (inquireBtn) {
        inquireBtn.href = 'https://wa.me/' + ProductConfig.whatsappNumber + '?text=' + encodeURIComponent('مرحباً، لدي استفسار حول ' + ProductConfig.title + ' (' + pageUrl + ')');
      }
    }

    function updateQuantity(diff) {
      let q = ProductConfig.quantity + diff;
      if (q < 1) q = 1;
      if (q > 99) q = 99;
      ProductConfig.quantity = q;
      document.getElementById('product-quantity-input').value = q;
      updateProductUI();
    }

    function changeCurrency(curr) {
      ProductConfig.currentCurrency = curr;
      localStorage.setItem('rosomat_currency', curr);
      updateProductUI();
      const modalEl = document.getElementById('currencyModal');
      if (modalEl && window.bootstrap && bootstrap.Modal) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
      }
    }

    document.addEventListener('DOMContentLoaded', () => {
      document.getElementById('product-option-select').addEventListener('change', updateProductUI);
      updateProductUI();
    });
  </script>
</body>
</html>`;
}

// Download Generated HTML File
function downloadProductHtml() {
  if (!lastGeneratedHtml) return;
  const blob = new Blob([lastGeneratedHtml], { type: 'text/html;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${lastGeneratedSlug}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Copy Generated HTML Code
function copyGeneratedCode() {
  if (!lastGeneratedHtml) return;
  navigator.clipboard.writeText(lastGeneratedHtml).then(() => {
    alert('تم نسخ كود صفحة المنتج (HTML) إلى الحافظة بنجاح!');
  });
}

// Preview in New Tab
function previewGeneratedHtml() {
  if (!lastGeneratedHtml) return;
  const blob = new Blob([lastGeneratedHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

// Copy CSV Row
function copyCsvRow() {
  if (!lastGeneratedCsvRow) return;
  navigator.clipboard.writeText(lastGeneratedCsvRow).then(() => {
    alert('تم نسخ سطر الـ CSV بنجاح! يمكنك لصقه في ملف data/products.csv');
  });
}

// Download Updated products.csv
function downloadUpdatedCSV() {
  const csvContent = exportToCSV(currentProductsList);
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' }); // BOM for Excel Arabic support
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'products.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Render CSV Table in Admin
function renderCsvTable() {
  const tbody = document.getElementById('csv-table-body');
  const countBadge = document.getElementById('csv-count-badge');
  if (countBadge) countBadge.textContent = currentProductsList.length;

  if (!tbody) return;

  if (currentProductsList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-muted">لا توجد منتجات مسجلة</td></tr>';
    return;
  }

  tbody.innerHTML = currentProductsList.map((p) => `
    <tr>
      <td class="fw-bold">${p.id}</td>
      <td>
        <img src="${p.image}" alt="" style="width: 44px; height: 44px; object-fit: cover; border-radius: 6px;" onerror="this.src='https://via.placeholder.com/50x50.png';">
      </td>
      <td>
        <div class="fw-bold">${p.title}</div>
        <small class="text-muted">SKU: ${p.sku}</small>
      </td>
      <td><span class="badge bg-light text-dark border">${p.category}</span></td>
      <td class="fw-bold text-success">${Number(p.price_yer).toLocaleString()} ر.ي</td>
      <td class="fw-bold text-primary">${Number(p.price_sar).toLocaleString()} ر.س</td>
      <td class="text-muted">$${Number(p.price_usd).toLocaleString()}</td>
      <td><a href="${p.url}" target="_blank" class="small text-decoration-underline text-truncate d-inline-block" style="max-width: 140px;">${p.url}</a></td>
      <td>
        <button type="button" class="btn btn-sm btn-outline-danger" onclick="deleteProductFromCsv(${p.id})" title="حذف من الـ CSV">
          <i class="ti ti-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function deleteProductFromCsv(id) {
  if (confirm('هل أنت متأكد من حذف هذا المنتج من قائمة الـ CSV؟')) {
    currentProductsList = currentProductsList.filter(p => p.id !== id);
    try {
      localStorage.setItem('rosomat_products_csv', exportToCSV(currentProductsList));
    } catch (e) {
      console.warn('localStorage save failed', e);
    }
    renderCsvTable();
  }
}

// Reload CSV from data/products.csv with fallback to localStorage & offline carrier
async function reloadCsvFromDataFolder() {
  let csvText = null;

  // 1. Try to fetch data/products.csv directly (Works on GitHub Pages or local server)
  try {
    const res = await fetch('data/products.csv?v=' + Date.now());
    if (res.ok) {
      const text = await res.text();
      if (text && text.trim().length > 10) {
        csvText = text;
      }
    }
  } catch (e) {
    // Normal on file:///
  }

  // 2. Check localStorage (Previous modifications made in admin panel)
  if (!csvText && localStorage.getItem('rosomat_products_csv')) {
    csvText = localStorage.getItem('rosomat_products_csv');
  }

  // 3. Check window.ROSOMAT_DEFAULT_CSV (Offline JS carrier)
  if (!csvText && window.ROSOMAT_DEFAULT_CSV) {
    csvText = window.ROSOMAT_DEFAULT_CSV;
  }

  if (csvText) {
    const parsed = parseCSV(csvText);
    if (parsed && parsed.length > 0) {
      currentProductsList = parsed;
      renderCsvTable();
      return;
    }
  }

  // 4. Default Fallback
  currentProductsList = [...INITIAL_PRODUCTS];
  renderCsvTable();
}

// Initial Setup
document.addEventListener('DOMContentLoaded', () => {
  // Add 2 default option rows in form: name, yer, sar, usd
  addOptionRow('الباقة الأساسية', '600000', '1500', '400');
  addOptionRow('الباقة الاحترافية المتقدمة', '1200000', '3000', '800');

  // Load existing products
  reloadCsvFromDataFolder();
});
