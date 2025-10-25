const pageDonghua = document.getElementById("page-donghua")
const pageAbout = document.getElementById("page-about")
const pageSupport = document.getElementById("page-support")
const donghuaList = document.getElementById("donghuaList")

let currentDonghuaSlug = null
let currentDonghua = null
let allDonghuaData = []
let bannerIndex = 0
let bannerInterval = null

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
  pageDonghua.style.display = "block"
  pageAbout.style.display = "none"
  pageSupport.style.display = "none"
  loadBanner()
}

function goToAbout() {
  closeMenu()
  pageDonghua.style.display = "none"
  pageAbout.style.display = "block"
  pageSupport.style.display = "none"
  if (bannerInterval) clearInterval(bannerInterval)
}

function goToSupport() {
  closeMenu()
  pageDonghua.style.display = "none"
  pageAbout.style.display = "none"
  pageSupport.style.display = "block"
  if (bannerInterval) clearInterval(bannerInterval)
}

async function loadBanner() {
  try {
    const response = await fetch(`${API_BASE}/api/donghua/popular`)
    const result = await response.json()

    if (!result.success || !result.data || result.data.length === 0) {
      return
    }

    const bannerSlider = document.getElementById("bannerSlider")
    bannerSlider.innerHTML = ""

    const bannerData = result.data.slice(0, 5)

    bannerData.forEach((donghua, index) => {
      const slide = document.createElement("div")
      slide.className = "banner-slide" + (index === 0 ? " active" : "")
      slide.style.backgroundImage = `url('${donghua.image_url}')`

      slide.innerHTML = `
        <div class="banner-overlay">
          <div class="banner-title">${donghua.name}</div>
        </div>
      `

      slide.onclick = () => openDetail(donghua.slug)
      bannerSlider.appendChild(slide)
    })

    const navDiv = document.createElement("div")
    navDiv.className = "slider-nav"
    bannerData.forEach((_, index) => {
      const dot = document.createElement("div")
      dot.className = "slider-dot" + (index === 0 ? " active" : "")
      dot.onclick = (e) => {
        e.stopPropagation()
        showBannerSlide(index)
      }
      navDiv.appendChild(dot)
    })
    bannerSlider.appendChild(navDiv)

    if (bannerInterval) clearInterval(bannerInterval)
    bannerInterval = setInterval(() => {
      bannerIndex = (bannerIndex + 1) % bannerData.length
      showBannerSlide(bannerIndex)
    }, 5000)
  } catch (error) {
    console.error("Error loading banner:", error)
  }
}

function showBannerSlide(index) {
  bannerIndex = index
  const slides = document.querySelectorAll(".banner-slide")
  const dots = document.querySelectorAll(".slider-dot")

  slides.forEach((slide, i) => {
    slide.classList.toggle("active", i === index)
  })

  dots.forEach((dot, i) => {
    dot.classList.toggle("active", i === index)
  })
}

async function loadDonghua() {
  try {
    const [popularResponse, listResponse] = await Promise.all([
      fetch(`${API_BASE}/api/donghua/popular`),
      fetch(`${API_BASE}/api/donghua/list`)
    ])

    const popularResult = await popularResponse.json()
    const listResult = await listResponse.json()

    let allData = []

    if (popularResult.success && popularResult.data && popularResult.data.length > 0) {
      allData = [...popularResult.data]
      displayPopular(popularResult.data.slice(0, 12))
    }

    if (listResult.success && listResult.data && listResult.data.length > 0) {
      allData = [...allData, ...listResult.data]
    }

    allDonghuaData = allData

    if (allData.length > 12) {
      displayDonghua(allData.slice(12, 42), false)
    } else if (allData.length > 0) {
      displayDonghua(allData, false)
    } else {
      donghuaList.innerHTML = '<p class="text-center text-light w-100">Tidak ada donghua ditemukan</p>'
    }

    loadBanner()
  } catch (error) {
    console.error("Error loading donghua:", error)
    donghuaList.innerHTML = '<p class="text-center text-light w-100">Gagal memuat data donghua</p>'
  }
}

function displayPopular(popularData) {
  const popularList = document.getElementById("popularList")

  if (!popularList) {
    console.error('popularList element not found!')
    return
  }

  popularList.innerHTML = ""

  if (!popularData || popularData.length === 0) {
    popularList.innerHTML = '<p class="text-center text-light w-100">Tidak ada donghua populer</p>'
    return
  }

  popularData.forEach((donghua, i) => {
    const col = document.createElement("div")
    col.className = "anime-col"

    const card = document.createElement("div")
    card.className = "card p-2 anime-card h-100"
    card.onclick = () => openDetail(donghua.slug)

    const img = document.createElement("img")
    img.src = donghua.image_url || ""
    img.alt = "Donghua"
    img.onerror = function () {
      this.src = "https://via.placeholder.com/300x140?text=No+Image"
    }

    const title = document.createElement("h3")
    title.className = "fs-6 mt-2 mb-1 text-truncate"
    title.textContent = donghua.name

    const typeLabel = document.createElement("div")
    typeLabel.className = "card-type-label"
    const isNew = i < 5
    typeLabel.innerHTML = `
      <span class="type-text">Donghua</span>
      ${isNew ? '<span class="new-badge">NEW</span>' : ''}
    `

    card.appendChild(img)
    card.appendChild(title)
    card.appendChild(typeLabel)
    col.appendChild(card)
    popularList.appendChild(col)
  })
}

function displayDonghua(donghuaData, showGroupHeader = true) {
  if (!donghuaList) {
    console.error('donghuaList element not found!')
    return
  }

  donghuaList.innerHTML = ""

  if (!donghuaData || donghuaData.length === 0) {
    donghuaList.innerHTML = '<p class="text-center text-light w-100">Tidak ada donghua ditemukan</p>'
    return
  }

  donghuaData.forEach((donghua, idx) => {
    const col = document.createElement("div")
    col.className = "anime-col"

    const card = document.createElement("div")
    card.className = "card p-2 anime-card h-100"
    card.onclick = () => openDetail(donghua.slug)

    const img = document.createElement("img")
    img.src = donghua.image_url || ""
    img.alt = "Donghua"
    img.onerror = function () {
      this.src = "https://via.placeholder.com/300x140?text=No+Image"
    }

    const title = document.createElement("h3")
    title.className = "fs-6 mt-2 mb-1 text-truncate"
    title.textContent = donghua.name

    const isNew = idx < 8
    const typeLabel = document.createElement("div")
    typeLabel.className = "card-type-label"
    typeLabel.innerHTML = `
      <span class="type-text">Donghua</span>
      ${isNew ? '<span class="new-badge">NEW</span>' : ''}
    `

    card.appendChild(img)
    card.appendChild(title)
    card.appendChild(typeLabel)
    col.appendChild(card)
    donghuaList.appendChild(col)
  })
}

async function searchDonghua() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase().trim()
  const popularList = document.getElementById("popularList")

  if (searchTerm === "") {
    const popularData = allDonghuaData.slice(0, 6)
    const remainingData = allDonghuaData.slice(6, 15)

    displayPopular(popularData)
    displayDonghua(remainingData, false)
    popularList.parentElement.style.display = "block"
    return
  }

  try {
    const response = await fetch(`${API_BASE}/api/donghua/search?q=${encodeURIComponent(searchTerm)}`)
    const result = await response.json()

    if (result.success && result.data) {
      popularList.parentElement.style.display = "none"
      displayDonghua(result.data, true)
    }
  } catch (error) {
    console.error("Error searching donghua:", error)
  }
}

async function openDetail(slug) {
  window.location.href = `donghua-detail.html?slug=${slug}`
}

function formatDate(dateString) {
  if (!dateString) return "Unknown"
  const date = new Date(dateString)
  return date.toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric" })
}

loadDonghua()
