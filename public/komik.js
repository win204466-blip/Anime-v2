const pageKomik = document.getElementById("page-komik")
const pageAbout = document.getElementById("page-about")
const pageSupport = document.getElementById("page-support")
const komikList = document.getElementById("komikList")

let currentType = "manga"
let allKomikData = []

const API_BASE = window.location.origin

function toggleSearch() {
  const searchBox = document.getElementById("toggleSearch")
  searchBox.classList.toggle("active")
  if (searchBox.classList.contains("active")) {
    document.getElementById("searchInput").focus()
  }
}

function toggleMenu() {
  const menu = document.getElementById("sidebarMenu")
  const overlay = document.getElementById("sidebarOverlay")
  const mainContent = document.getElementById("mainContent")

  menu.classList.toggle("active")
  overlay.classList.toggle("active")
  mainContent.classList.toggle("shifted")
}

function closeMenu() {
  const menu = document.getElementById("sidebarMenu")
  const overlay = document.getElementById("sidebarOverlay")
  const mainContent = document.getElementById("mainContent")

  if (menu.classList.contains("active")) {
    menu.classList.remove("active")
    overlay.classList.remove("active")
    mainContent.classList.remove("shifted")
  }
}

function goToHome() {
  closeMenu()
  pageKomik.style.display = "block"
  pageAbout.style.display = "none"
  pageSupport.style.display = "none"
}

function goToAbout() {
  closeMenu()
  pageKomik.style.display = "none"
  pageAbout.style.display = "block"
  pageSupport.style.display = "none"
}

function goToSupport() {
  closeMenu()
  pageKomik.style.display = "none"
  pageAbout.style.display = "none"
  pageSupport.style.display = "block"
}

function changeType(type) {
  currentType = type

  document.getElementById("btn-manga").style.background = type === "manga" ? "rgba(220, 38, 38, 0.2)" : "rgba(75, 85, 99, 0.2)"
  document.getElementById("btn-manga").style.color = type === "manga" ? "#fff" : "#9ca3af"
  document.getElementById("btn-manga").style.borderColor = type === "manga" ? "rgba(220, 38, 38, 0.4)" : "rgba(75, 85, 99, 0.3)"

  document.getElementById("btn-manhwa").style.background = type === "manhwa" ? "rgba(220, 38, 38, 0.2)" : "rgba(75, 85, 99, 0.2)"
  document.getElementById("btn-manhwa").style.color = type === "manhwa" ? "#fff" : "#9ca3af"
  document.getElementById("btn-manhwa").style.borderColor = type === "manhwa" ? "rgba(220, 38, 38, 0.4)" : "rgba(75, 85, 99, 0.3)"

  document.getElementById("btn-manhua").style.background = type === "manhua" ? "rgba(220, 38, 38, 0.2)" : "rgba(75, 85, 99, 0.2)"
  document.getElementById("btn-manhua").style.color = type === "manhua" ? "#fff" : "#9ca3af"
  document.getElementById("btn-manhua").style.borderColor = type === "manhua" ? "rgba(220, 38, 38, 0.4)" : "rgba(75, 85, 99, 0.3)"

  const title = type === "manga" ? "Manga" : type === "manhwa" ? "Manhwa" : "Manhua"
  document.getElementById("komikTitle").textContent = `Daftar ${title}`

  loadKomik(type)
}

async function loadKomik(type = "manga") {
  try {
    komikList.innerHTML = '<p class="text-center text-light w-100">Memuat data...</p>'

    const response = await fetch(`${API_BASE}/api/komik/list?type=${type}`)
    const result = await response.json()

    if (result.success && result.data && result.data.length > 0) {
      allKomikData = result.data
      displayKomik(result.data)
    } else {
      komikList.innerHTML = '<p class="text-center text-light w-100">Tidak ada komik ditemukan</p>'
    }
  } catch (error) {
    console.error("Error loading komik:", error)
    komikList.innerHTML = '<p class="text-center text-light w-100">Gagal memuat data komik</p>'
  }
}

function displayKomik(komikData) {
  if (!komikList) {
    console.error('komikList element not found!')
    return
  }

  komikList.innerHTML = ""

  if (!komikData || komikData.length === 0) {
    komikList.innerHTML = '<p class="text-center text-light w-100">Tidak ada komik ditemukan</p>'
    return
  }

  komikData.forEach((komik, index) => {
    const col = document.createElement("div")
    col.className = "anime-col"

    const card = document.createElement("div")
    card.className = "card p-2 anime-card h-100"
    card.onclick = () => openDetail(komik.slug)

    const img = document.createElement("img")
    img.src = komik.thumbnail || ""
    img.alt = "Komik"
    img.onerror = function () {
      this.src = "https://via.placeholder.com/300x140?text=No+Image"
    }

    const title = document.createElement("h3")
    title.className = "fs-6 mt-2 mb-1 text-truncate"
    title.textContent = komik.title

    const isNew = index < 8
    const typeLabel = document.createElement("div")
    typeLabel.className = "card-type-label"
    typeLabel.innerHTML = `
      <span class="type-text">${komik.type || "Komik"}</span>
      ${isNew ? '<span class="new-badge">NEW</span>' : ''}
    `

    card.appendChild(img)
    card.appendChild(title)
    card.appendChild(typeLabel)
    col.appendChild(card)
    komikList.appendChild(col)
  })
}

async function searchKomik() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase().trim()

  if (searchTerm === "") {
    loadKomik(currentType)
    return
  }

  try {
    const response = await fetch(`${API_BASE}/api/komik/search?q=${encodeURIComponent(searchTerm)}`)
    const result = await response.json()

    if (result.success && result.data) {
      displayKomik(result.data)
    }
  } catch (error) {
    console.error("Error searching komik:", error)
  }
}

function openDetail(slug) {
  window.location.href = `komik-detail.html?slug=${slug}`
}

loadKomik("manga")
