import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBulT204iimhqZnCzMOqnt5OKDHcjO01dA",
  authDomain: "bouquetien.firebaseapp.com",
  projectId: "bouquetien",
  storageBucket: "bouquetien.firebasestorage.app",
  messagingSenderId: "194900591485",
  appId: "1:194900591485:web:937872a70f20b09ecf4214",
};

const cloudinaryConfig = {
  cloudName: "drrjwtejc",
  uploadPreset: "BOUQUETIEN",
  folder: "bouquetien",
};

const adminEmails = ["rikokulu64@gmail.com", "tien@bedz.com"];

const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const defaultSettings = {
  brandName: "bouquetien",
  heroText: "Rangkaian uang bentuk bunga untuk hadiah, wisuda, wedding, dan momen harian lainya.",
  heroImages: {
    left: "https://images.unsplash.com/photo-1518709779341-56cf4535e94b?auto=format&fit=crop&w=800&q=80",
    main: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=1400&q=80",
    right: "https://images.unsplash.com/photo-1470509037663-253afd7f0f51?auto=format&fit=crop&w=800&q=80",
  },
  whatsappNumbers: ["6281234567890"],
  socialLinks: {
    instagram: "",
    tiktok: "",
    youtube: "",
  },
};

const fallbackProducts = [
  {
    id: "sample-1",
    name: "Blush Garden Bouquet",
    price: 175000,
    description: "Bouquet bernuansa pastel dengan sentuhan bunga segar dan wrapping elegan.",
    imageUrl:
      "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "sample-2",
    name: "Soft White Bloom",
    price: 150000,
    description: "Rangkaian putih minimalis untuk hadiah intimate, wisuda, dan anniversary.",
    imageUrl:
      "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "sample-3",
    name: "Rose Petite Wrap",
    price: 120000,
    description: "Ukuran petite yang manis, ringan dibawa, dan tetap terlihat premium.",
    imageUrl:
      "https://images.unsplash.com/photo-1518709779341-56cf4535e94b?auto=format&fit=crop&w=900&q=80",
  },
];

const elements = {
  adminDialog: document.querySelector("#adminDialog"),
  adminOpenBtn: document.querySelector("#adminOpenBtn"),
  adminCloseBtn: document.querySelector("#adminCloseBtn"),
  loginForm: document.querySelector("#loginForm"),
  loginMessage: document.querySelector("#loginMessage"),
  adminPanel: document.querySelector("#adminPanel"),
  adminEmail: document.querySelector("#adminEmail"),
  logoutBtn: document.querySelector("#logoutBtn"),
  productForm: document.querySelector("#productForm"),
  productMessage: document.querySelector("#productMessage"),
  productGrid: document.querySelector("#productGrid"),
  publicStatus: document.querySelector("#publicStatus"),
  adminList: document.querySelector("#adminList"),
  searchInput: document.querySelector("#searchInput"),
  resetFormBtn: document.querySelector("#resetFormBtn"),
  productIdInput: document.querySelector("#productIdInput"),
  nameInput: document.querySelector("#nameInput"),
  priceInput: document.querySelector("#priceInput"),
  descriptionInput: document.querySelector("#descriptionInput"),
  photoInput: document.querySelector("#photoInput"),
  emailInput: document.querySelector("#emailInput"),
  passwordInput: document.querySelector("#passwordInput"),
  brandName: document.querySelector("#brandName"),
  heroText: document.querySelector("#heroText"),
  socialLinks: document.querySelector("#socialLinks"),
  settingsForm: document.querySelector("#settingsForm"),
  settingsMessage: document.querySelector("#settingsMessage"),
  brandInput: document.querySelector("#brandInput"),
  heroTextInput: document.querySelector("#heroTextInput"),
  heroLeftInput: document.querySelector("#heroLeftInput"),
  heroMainInput: document.querySelector("#heroMainInput"),
  heroRightInput: document.querySelector("#heroRightInput"),
  whatsappInput: document.querySelector("#whatsappInput"),
  instagramInput: document.querySelector("#instagramInput"),
  tiktokInput: document.querySelector("#tiktokInput"),
  youtubeInput: document.querySelector("#youtubeInput"),
};

let products = [];
let siteSettings = structuredClone(defaultSettings);
let db;
let auth;

function isFirebaseConfigured() {
  return !firebaseConfig.apiKey.startsWith("ISI_");
}

function isCloudinaryConfigured() {
  return !cloudinaryConfig.cloudName.startsWith("ISI_") && !cloudinaryConfig.uploadPreset.startsWith("ISI_");
}

function isAdminUser(user) {
  return Boolean(user?.email && adminEmails.includes(user.email.toLowerCase()));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatPrice(value) {
  return currency.format(Number(value || 0));
}

function normalizeWhatsappNumbers(value) {
  const lines = Array.isArray(value) ? value : String(value || "").split(/\n|,/);
  const numbers = lines
    .map((number) => String(number).replace(/[^\d]/g, ""))
    .filter((number) => number.length >= 9);

  return [...new Set(numbers)];
}

function getWhatsappNumbers() {
  const numbers = normalizeWhatsappNumbers(siteSettings.whatsappNumbers);
  return numbers.length ? numbers : defaultSettings.whatsappNumbers;
}

function getWhatsappLink(product, number) {
  const text = `Halo ${siteSettings.brandName}, saya mau pesan ${product.name} (${formatPrice(product.price)}).`;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

function setHeroBackground(selector, imageUrl, overlay = "") {
  const element = document.querySelector(selector);
  if (!element || !imageUrl) {
    return;
  }

  element.style.backgroundImage = `${overlay}url("${imageUrl}")`;
}

function renderSocialLinks() {
  const links = [
    ["Instagram", siteSettings.socialLinks?.instagram],
    ["TikTok", siteSettings.socialLinks?.tiktok],
    ["YouTube", siteSettings.socialLinks?.youtube],
  ].filter((item) => item[1]);

  elements.socialLinks.innerHTML = links.length
    ? links
        .map(
          ([label, url]) =>
            `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(label)}</a>`,
        )
        .join("")
    : `<span class="empty-social">Link sosial media belum diisi.</span>`;
}

function renderSiteSettings() {
  elements.brandName.textContent = siteSettings.brandName || defaultSettings.brandName;
  elements.heroText.textContent = siteSettings.heroText || defaultSettings.heroText;
  document.title = `${siteSettings.brandName || "BOUQUETIEN"} - Katalog Produk`;

  setHeroBackground(
    ".hero-left",
    siteSettings.heroImages?.left || defaultSettings.heroImages.left,
    "linear-gradient(rgba(255, 253, 249, 0.18), rgba(255, 253, 249, 0.18)), ",
  );
  setHeroBackground(
    ".hero-main",
    siteSettings.heroImages?.main || defaultSettings.heroImages.main,
    "linear-gradient(to top, rgba(255, 253, 249, 0.78), rgba(255, 253, 249, 0.08) 46%), ",
  );
  setHeroBackground(
    ".hero-right",
    siteSettings.heroImages?.right || defaultSettings.heroImages.right,
    "linear-gradient(rgba(62, 57, 52, 0.1), rgba(62, 57, 52, 0.1)), ",
  );

  renderSocialLinks();
  renderProducts();
}

function fillSettingsForm() {
  elements.brandInput.value = siteSettings.brandName || defaultSettings.brandName;
  elements.heroTextInput.value = siteSettings.heroText || defaultSettings.heroText;
  elements.whatsappInput.value = getWhatsappNumbers().join("\n");
  elements.instagramInput.value = siteSettings.socialLinks?.instagram || "";
  elements.tiktokInput.value = siteSettings.socialLinks?.tiktok || "";
  elements.youtubeInput.value = siteSettings.socialLinks?.youtube || "";
}

function renderProducts() {
  const keyword = elements.searchInput.value.trim().toLowerCase();
  const filteredProducts = products.filter((product) =>
    [product.name, product.description].join(" ").toLowerCase().includes(keyword),
  );

  const whatsappNumbers = getWhatsappNumbers();

  elements.productGrid.innerHTML = filteredProducts
    .map(
      (product) => {
        const whatsappButtons = whatsappNumbers
          .map((number, index) => {
            const label = whatsappNumbers.length === 1 ? "Pesan via WhatsApp" : `WhatsApp ${index + 1}`;
            return `<a class="wa-button" href="${getWhatsappLink(product, number)}" target="_blank" rel="noopener">${label}</a>`;
          })
          .join("");

        return `
        <article class="product-card">
          <img src="${escapeHtml(product.imageUrl)}" alt="${escapeHtml(product.name)}" loading="lazy">
          <div class="product-info">
            <h3>${escapeHtml(product.name)}</h3>
            <div class="price">${formatPrice(product.price)}</div>
            <p>${escapeHtml(product.description)}</p>
            <div class="wa-list">${whatsappButtons}</div>
          </div>
        </article>
      `;
      },
    )
    .join("");

  elements.publicStatus.textContent = filteredProducts.length
    ? `${filteredProducts.length} produk tersedia`
    : "Produk tidak ditemukan.";
}

function renderAdminList() {
  elements.adminList.innerHTML = products
    .map(
      (product) => `
        <div class="admin-product" data-id="${escapeHtml(product.id)}">
          <img src="${escapeHtml(product.imageUrl)}" alt="${escapeHtml(product.name)}">
          <div>
            <strong>${escapeHtml(product.name)}</strong>
            <span>${formatPrice(product.price)}</span>
          </div>
          <div class="admin-product-actions">
            <button class="ghost-button" type="button" data-action="edit">Edit</button>
            <button class="danger-button" type="button" data-action="delete">Hapus</button>
          </div>
        </div>
      `,
    )
    .join("");
}

function resetProductForm() {
  elements.productForm.reset();
  elements.productIdInput.value = "";
  elements.productMessage.textContent = "";
}

async function uploadToCloudinary(file) {
  if (!isCloudinaryConfigured()) {
    throw new Error("Konfigurasi Cloudinary belum diisi di app.js.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", cloudinaryConfig.uploadPreset);
  formData.append("folder", cloudinaryConfig.folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    throw new Error("Upload foto ke Cloudinary gagal.");
  }

  const data = await response.json();
  return data.secure_url;
}

function initFirebase() {
  renderSiteSettings();

  if (!isFirebaseConfigured()) {
    products = fallbackProducts;
    renderProducts();
    elements.publicStatus.textContent =
      "Mode demo aktif. Isi konfigurasi Firebase di app.js untuk database asli.";
    return;
  }

  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);

  onSnapshot(
    doc(db, "site", "settings"),
    (snapshot) => {
      siteSettings = {
        ...defaultSettings,
        ...(snapshot.exists() ? snapshot.data() : {}),
        heroImages: {
          ...defaultSettings.heroImages,
          ...(snapshot.exists() ? snapshot.data().heroImages : {}),
        },
        socialLinks: {
          ...defaultSettings.socialLinks,
          ...(snapshot.exists() ? snapshot.data().socialLinks : {}),
        },
      };
      renderSiteSettings();
      fillSettingsForm();
    },
    () => {
      elements.settingsMessage.textContent = "Gagal memuat pengaturan web.";
    },
  );

  onSnapshot(
    query(collection(db, "products"), orderBy("createdAt", "desc")),
    (snapshot) => {
      products = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      renderProducts();
      renderAdminList();
    },
    () => {
      elements.publicStatus.textContent = "Gagal memuat produk dari Firestore.";
    },
  );

  onAuthStateChanged(auth, (user) => {
    const allowedAdmin = isAdminUser(user);
    elements.loginForm.hidden = allowedAdmin;
    elements.adminPanel.hidden = !allowedAdmin;
    elements.adminEmail.textContent = user?.email || "";
    if (user && !allowedAdmin) {
      elements.loginMessage.textContent = "Email ini tidak punya akses admin.";
      signOut(auth);
      return;
    }
    if (allowedAdmin) {
      renderAdminList();
      fillSettingsForm();
    }
  });
}

elements.searchInput.addEventListener("input", renderProducts);

elements.adminOpenBtn.addEventListener("click", () => {
  elements.adminDialog.showModal();
});

elements.adminCloseBtn.addEventListener("click", () => {
  elements.adminDialog.close();
});

elements.resetFormBtn.addEventListener("click", resetProductForm);

elements.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  elements.loginMessage.textContent = "";

  if (!auth) {
    elements.loginMessage.textContent = "Konfigurasi Firebase belum diisi.";
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, elements.emailInput.value, elements.passwordInput.value);
    elements.loginForm.reset();
  } catch (error) {
    elements.loginMessage.textContent = "Login gagal. Periksa email dan password.";
  }
});

elements.logoutBtn.addEventListener("click", async () => {
  if (auth) {
    await signOut(auth);
  }
});

elements.settingsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  elements.settingsMessage.textContent = "Menyimpan pengaturan...";

  if (!db || !isAdminUser(auth?.currentUser)) {
    elements.settingsMessage.textContent = "Admin harus login dan konfigurasi Firebase harus aktif.";
    return;
  }

  try {
    const heroImages = {
      ...defaultSettings.heroImages,
      ...(siteSettings.heroImages || {}),
    };

    const imageFields = [
      ["left", elements.heroLeftInput.files[0]],
      ["main", elements.heroMainInput.files[0]],
      ["right", elements.heroRightInput.files[0]],
    ];

    for (const [key, file] of imageFields) {
      if (file) {
        heroImages[key] = await uploadToCloudinary(file);
      }
    }

    const whatsappNumbers = normalizeWhatsappNumbers(elements.whatsappInput.value);
    if (!whatsappNumbers.length) {
      elements.settingsMessage.textContent = "Isi minimal satu nomor WhatsApp.";
      return;
    }

    await setDoc(
      doc(db, "site", "settings"),
      {
        brandName: elements.brandInput.value.trim(),
        heroText: elements.heroTextInput.value.trim(),
        heroImages,
        whatsappNumbers,
        socialLinks: {
          instagram: elements.instagramInput.value.trim(),
          tiktok: elements.tiktokInput.value.trim(),
          youtube: elements.youtubeInput.value.trim(),
        },
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    elements.settingsForm.reset();
    fillSettingsForm();
    elements.settingsMessage.textContent = "Pengaturan tersimpan.";
  } catch (error) {
    elements.settingsMessage.textContent = error.message || "Pengaturan gagal disimpan.";
  }
});

elements.productForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  elements.productMessage.textContent = "Menyimpan produk...";

  if (!db || !isAdminUser(auth?.currentUser)) {
    elements.productMessage.textContent = "Admin harus login dan konfigurasi harus aktif.";
    return;
  }

  const editingId = elements.productIdInput.value;
  const existingProduct = products.find((product) => product.id === editingId);
  const photoFile = elements.photoInput.files[0];

  try {
    let imageUrl = existingProduct?.imageUrl || "";
    if (photoFile) {
      imageUrl = await uploadToCloudinary(photoFile);
    }

    if (!imageUrl) {
      elements.productMessage.textContent = "Pilih foto produk terlebih dahulu.";
      return;
    }

    const payload = {
      name: elements.nameInput.value.trim(),
      price: Number(elements.priceInput.value),
      description: elements.descriptionInput.value.trim(),
      imageUrl,
      updatedAt: serverTimestamp(),
    };

    if (editingId) {
      await updateDoc(doc(db, "products", editingId), payload);
    } else {
      await addDoc(collection(db, "products"), {
        ...payload,
        createdAt: serverTimestamp(),
      });
    }

    resetProductForm();
    elements.productMessage.textContent = "Produk tersimpan.";
  } catch (error) {
    elements.productMessage.textContent = error.message || "Produk gagal disimpan.";
  }
});

elements.adminList.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  const row = event.target.closest(".admin-product");
  if (!button || !row) {
    return;
  }

  const product = products.find((item) => item.id === row.dataset.id);
  if (!product) {
    return;
  }

  if (button.dataset.action === "edit") {
    elements.productIdInput.value = product.id;
    elements.nameInput.value = product.name;
    elements.priceInput.value = product.price;
    elements.descriptionInput.value = product.description;
    elements.productMessage.textContent = "Mode edit aktif. Foto boleh dikosongkan jika tidak diganti.";
    return;
  }

  if (button.dataset.action === "delete" && db && confirm(`Hapus ${product.name}?`)) {
    await deleteDoc(doc(db, "products", product.id));
  }
});

initFirebase();
