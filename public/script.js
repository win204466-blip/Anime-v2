const pageAnime = document.getElementById("page-anime")
const pageAbout = document.getElementById("page-about")
const pageSupport = document.getElementById("page-support")
const animeList = document.getElementById("animeList")

let currentAnimeSlug = null
let currentAnime = null
let currentEpisodeSlug = null
let allAnimeData = []
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
  pageAnime.style.display = "block"
  pageAbout.style.display = "none"
  pageSupport.style.display = "none"
  loadBanner()
}

function goToAbout() {
  closeMenu()
  pageAnime.style.display = "none"
  pageAbout.style.display = "block"
  pageSupport.style.display = "none"
  if (bannerInterval) clearInterval(bannerInterval)
}

function goToSupport() {
  closeMenu()
  pageAnime.style.display = "none"
  pageAbout.style.display = "none"
  pageSupport.style.display = "block"
  if (bannerInterval) clearInterval(bannerInterval)
}

async function loadBanner() {
  try {
    const response = await fetch(`${API_BASE}/api/popular`)
    const result = await response.json()

    if (!result.success || !result.data || result.data.length === 0) {
      return
    }

    const bannerSlider = document.getElementById("bannerSlider")
    bannerSlider.innerHTML = ""

    const bannerData = result.data.slice(0, 5)

    bannerData.forEach((anime, index) => {
      const slide = document.createElement("div")
      slide.className = "banner-slide" + (index === 0 ? " active" : "")
      slide.style.backgroundImage = `url('${anime.image_url}')`

      slide.innerHTML = `
        <div class="banner-overlay">
          <div class="banner-title">${anime.name}</div>
        </div>
      `

      slide.onclick = () => openDetail(anime.slug)
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

async function loadAnime() {
  try {
    const [popularResponse, homeResponse] = await Promise.all([
      fetch(`${API_BASE}/api/popular`),
      fetch(`${API_BASE}/api/home`)
    ])

    const popularResult = await popularResponse.json()
    const homeResult = await homeResponse.json()

    let allData = []

    if (popularResult.success && popularResult.data && popularResult.data.length > 0) {
      allData = [...popularResult.data]
      displayPopular(popularResult.data.slice(0, 12))
    }

    if (homeResult.success && homeResult.data && homeResult.data.length > 0) {
      allData = [...allData, ...homeResult.data]
    }

    allAnimeData = allData

    if (allData.length > 12) {
      displayAnime(allData.slice(12, 42), false)
    } else if (allData.length > 0) {
      displayAnime(allData, false)
    } else {
      animeList.innerHTML = '<p class="text-center text-light w-100">Tidak ada anime ditemukan</p>'
    }

    loadBanner()
  } catch (error) {
    console.error("Error loading anime:", error)
    animeList.innerHTML = '<p class="text-center text-light w-100">Gagal memuat data anime</p>'
  }
}

function getRelatedAnimeInfo(anime, allData) {
  const baseName = anime.name
    .toLowerCase()
    .replace(/season\s*\d+|s\d+|part\s*\d+|\d+/gi, "")
    .trim()
  const related = allData.filter((a) => {
    const aBaseName = a.name
      .toLowerCase()
      .replace(/season\s*\d+|s\d+|part\s*\d+|\d+/gi, "")
      .trim()
    return aBaseName === baseName && a.id !== anime.id
  })

  const seasonMatch = anime.name.match(/season\s*(\d+)|s(\d+)|part\s*(\d+)/i)
  const seasonNumber = seasonMatch ? seasonMatch[1] || seasonMatch[2] || seasonMatch[3] : null

  return {
    hasRelated: related.length > 0,
    seasonNumber: seasonNumber,
    relatedCount: related.length + 1,
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
    popularList.innerHTML = '<p class="text-center text-light w-100">Tidak ada anime populer</p>'
    return
  }

  const grouped = new Map()
  const processedIds = new Set()

  popularData.forEach((anime) => {
    if (processedIds.has(anime.id)) return

    const baseName = anime.name
      .toLowerCase()
      .replace(/season\s*\d+|s\d+|part\s*\d+|\d+/gi, "")
      .trim()

    if (!grouped.has(baseName)) {
      grouped.set(baseName, [])
    }
    grouped.get(baseName).push(anime)
    processedIds.add(anime.id)

    const related = popularData.filter((a) => {
      const aBaseName = a.name
        .toLowerCase()
        .replace(/season\s*\d+|s\d+|part\s*\d+|\d+/gi, "")
        .trim()
      return aBaseName === baseName && a.id !== anime.id && !processedIds.has(a.id)
    })

    related.forEach((r) => {
      grouped.get(baseName).push(r)
      processedIds.add(r.id)
    })
  })

  let cardIndex = 0
  grouped.forEach((animeGroup, baseName) => {
    if (animeGroup.length > 1) {
      const groupHeader = document.createElement("div")
      groupHeader.className = "w-100 mt-3 mb-2"
      groupHeader.innerHTML = `<small class="text-light" style="opacity: 0.7;"><i class="bi bi-collection-fill me-1"></i>Anime Terkait: ${animeGroup[0].name.replace(/season\s*\d+|s\d+|part\s*\d+|\d+/gi, "").trim()}</small>`
      popularList.appendChild(groupHeader)
    }

    animeGroup.forEach((anime, i) => {
      const currentCardIndex = cardIndex++
      const col = document.createElement("div")
      col.className = "anime-col"

      const card = document.createElement("div")
      card.className = "card p-2 anime-card h-100"
      card.onclick = () => openDetail(anime.slug)

      const img = document.createElement("img")
      img.src = anime.image_url || ""
      img.alt = "Anime"
      img.onerror = function () {
        this.src = "https://via.placeholder.com/300x140?text=No+Image"
      }

      const seasonMatch = anime.name.match(/season\s*(\d+)|s(\d+)|part\s*(\d+)/i)
      const seasonNumber = seasonMatch ? seasonMatch[1] || seasonMatch[2] || seasonMatch[3] : null

      const title = document.createElement("h3")
      title.className = "fs-6 mt-2 mb-1 text-truncate"
      title.textContent = anime.name

      if (animeGroup.length > 1 && seasonNumber) {
        const badge = document.createElement("span")
        badge.className = "related-badge"
        badge.textContent = `S${seasonNumber}`
        title.appendChild(badge)
      }

      const typeLabel = document.createElement("div")
      typeLabel.className = "card-type-label"
      const isNew = currentCardIndex < 5
      typeLabel.innerHTML = `
        <span class="type-text">Anime</span>
        ${isNew ? '<span class="new-badge">NEW</span>' : ''}
      `

      card.appendChild(img)
      card.appendChild(title)
      card.appendChild(typeLabel)
      col.appendChild(card)
      popularList.appendChild(col)
    })
  })
}

function displayAnime(animeData, showGroupHeader = true) {
  if (!animeList) {
    console.error('animeList element not found!')
    return
  }

  animeList.innerHTML = ""

  if (!animeData || animeData.length === 0) {
    animeList.innerHTML = '<p class="text-center text-light w-100">Tidak ada anime ditemukan</p>'
    return
  }

  const grouped = new Map()
  const processedIds = new Set()

  animeData.forEach((anime) => {
    if (processedIds.has(anime.id)) return

    const baseName = anime.name
      .toLowerCase()
      .replace(/season\s*\d+|s\d+|part\s*\d+|\d+/gi, "")
      .trim()

    if (!grouped.has(baseName)) {
      grouped.set(baseName, [])
    }
    grouped.get(baseName).push(anime)
    processedIds.add(anime.id)

    const related = animeData.filter((a) => {
      const aBaseName = a.name
        .toLowerCase()
        .replace(/season\s*\d+|s\d+|part\s*\d+|\d+/gi, "")
        .trim()
      return aBaseName === baseName && a.id !== anime.id && !processedIds.has(a.id)
    })

    related.forEach((r) => {
      grouped.get(baseName).push(r)
      processedIds.add(r.id)
    })
  })

  grouped.forEach((animeGroup, baseName) => {
    if (animeGroup.length > 1 && showGroupHeader) {
      const groupHeader = document.createElement("div")
      groupHeader.className = "w-100 mt-3 mb-2"
      groupHeader.innerHTML = `<small class="text-light" style="opacity: 0.7;"><i class="bi bi-collection-fill me-1"></i>Anime Terkait: ${animeGroup[0].name.replace(/season\s*\d+|s\d+|part\s*\d+|\d+/gi, "").trim()}</small>`
      animeList.appendChild(groupHeader)
    }

    animeGroup.forEach((anime, idx) => {
      const col = document.createElement("div")
      col.className = "anime-col"

      const card = document.createElement("div")
      card.className = "card p-2 anime-card h-100"
      card.onclick = () => openDetail(anime.slug)

      const img = document.createElement("img")
      img.src = anime.image_url || ""
      img.alt = "Anime"
      img.onerror = function () {
        this.src = "https://via.placeholder.com/300x140?text=No+Image"
      }

      const seasonMatch = anime.name.match(/season\s*(\d+)|s(\d+)|part\s*(\d+)/i)
      const seasonNumber = seasonMatch ? seasonMatch[1] || seasonMatch[2] || seasonMatch[3] : null

      const title = document.createElement("h3")
      title.className = "fs-6 mt-2 mb-1 text-truncate"
      title.textContent = anime.name

      if (animeGroup.length > 1 && seasonNumber) {
        const badge = document.createElement("span")
        badge.className = "related-badge"
        badge.textContent = `S${seasonNumber}`
        title.appendChild(badge)
      }

      const allAnimeIndex = animeData.indexOf(anime)
      const isNew = allAnimeIndex >= 0 && allAnimeIndex < 8
      const typeLabel = document.createElement("div")
      typeLabel.className = "card-type-label"
      typeLabel.innerHTML = `
        <span class="type-text">Anime</span>
        ${isNew ? '<span class="new-badge">NEW</span>' : ''}
      `

      card.appendChild(img)
      card.appendChild(title)
      card.appendChild(typeLabel)
      col.appendChild(card)
      animeList.appendChild(col)
    })
  })
}

async function searchAnime() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase().trim()
  const popularList = document.getElementById("popularList")

  if (searchTerm === "") {
    const popularData = allAnimeData.slice(0, 6)
    const remainingData = allAnimeData.slice(6, 15)

    displayPopular(popularData)
    displayAnime(remainingData, false)
    popularList.parentElement.style.display = "block"
    return
  }

  try {
    const response = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(searchTerm)}`)
    const result = await response.json()

    if (result.success && result.data) {
      popularList.parentElement.style.display = "none"
      displayAnime(result.data, true)
    }
  } catch (error) {
    console.error("Error searching anime:", error)
  }
}

async function openDetail(slug) {
  window.location.href = `detail.html?slug=${slug}`
}



function formatDate(dateString) {
  if (!dateString) return "Unknown"
  const date = new Date(dateString)
  return date.toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric" })
}

loadAnime()
