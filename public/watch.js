const API_BASE = window.location.origin
let currentAnime = null
let currentAnimeSlug = null
let currentEpisodeSlug = null
let currentEpisodeNumber = null
let allEpisodes = []
let currentResolution = ''

function toggleMenu() {
  const menu = document.getElementById("sidebarMenu")
  const overlay = document.getElementById("sidebarOverlay")
  const mainContent = document.getElementById("mainContent")

  menu.classList.toggle("active")
  overlay.classList.toggle("active")
  mainContent.classList.toggle("shifted")
}

function goToDetail() {
  window.location.href = `detail.html?slug=${currentAnimeSlug}`
}

function goBack() {
  window.location.href = `detail.html?slug=${currentAnimeSlug}`
}

async function loadWatchPage() {
  const urlParams = new URLSearchParams(window.location.search)
  currentAnimeSlug = urlParams.get('anime')
  currentEpisodeSlug = urlParams.get('episode')
  currentEpisodeNumber = urlParams.get('num')

  if (!currentAnimeSlug || !currentEpisodeSlug) {
    window.location.href = 'index.html'
    return
  }

  try {
    const [animeResponse, episodeResponse] = await Promise.all([
      fetch(`${API_BASE}/api/anime/${currentAnimeSlug}`),
      fetch(`${API_BASE}/api/episode/${currentEpisodeSlug}`)
    ])

    const animeResult = await animeResponse.json()
    const episodeResult = await episodeResponse.json()

    if (!animeResult.success || !episodeResult.success) {
      alert("Gagal memuat video")
      window.location.href = `detail.html?slug=${currentAnimeSlug}`
      return
    }

    currentAnime = animeResult.data
    allEpisodes = currentAnime.episodes || []

    displayVideoPlayer(episodeResult.data)
    displayAnimeInfo()
    displayEpisodeList()
    saveContinueWatching()
    updateNavigationButtons()

    document.title = `Episode ${currentEpisodeNumber} - ${currentAnime.name} - Zeeniatt`
  } catch (error) {
    console.error("Error loading watch page:", error)
    alert("Gagal memuat video")
    window.location.href = 'index.html'
  }
}

function displayVideoPlayer(episodeData) {
  const videoContainer = document.getElementById("watchVideoContainer")
  const title = document.getElementById("watchEpisodeTitle")
  const desc = document.getElementById("watchEpisodeDesc")

  title.textContent = `Episode ${currentEpisodeNumber}`
  desc.textContent = episodeData.title || currentAnime.name

  if (episodeData.streaming_url) {
    let streamUrl = episodeData.streaming_url

    videoContainer.innerHTML = `
      <iframe 
        id="videoPlayer"
        class="video-player" 
        src="${streamUrl}" 
        frameborder="0" 
        allowfullscreen 
        scrolling="no"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share">
      </iframe>
    `
  } else {
    videoContainer.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #b0b0c0;">
        <p>URL streaming tidak ditemukan</p>
      </div>
    `
  }
}

function changeResolution() {
  const selector = document.getElementById("resolutionSelector")
  const resolution = selector.value

  if (!resolution) return

  const videoPlayer = document.getElementById("videoPlayer")
  if (!videoPlayer) {
    showNotification('Player tidak ditemukan')
    return
  }

  const currentSrc = videoPlayer.src

  let newSrc = currentSrc
  if (resolution === '360') {
    newSrc = currentSrc.replace(/\/(720|480|1080)p?/gi, '/360p')
  } else if (resolution === '480') {
    newSrc = currentSrc.replace(/\/(360|720|1080)p?/gi, '/480p')
  } else if (resolution === '720') {
    newSrc = currentSrc.replace(/\/(360|480|1080)p?/gi, '/720p')
  } else if (resolution === '1080') {
    newSrc = currentSrc.replace(/\/(360|480|720)p?/gi, '/1080p')
  }

  currentResolution = resolution

  if (newSrc !== currentSrc) {
    videoPlayer.src = newSrc
    showNotification(`Resolusi diubah ke ${resolution}p`)
  } else {
    showNotification(`Mencoba mengubah resolusi ke ${resolution}p...`)
  }
}

function displayAnimeInfo() {
  document.getElementById("watchAnimeImage").src = currentAnime.image_url
  document.getElementById("watchAnimeName").textContent = currentAnime.name
  document.getElementById("watchAnimeDesc").textContent = currentAnime.description || ""

  const genresContainer = document.getElementById("watchAnimeGenres")
  genresContainer.innerHTML = ""
  genresContainer.style.cssText = "display: flex; flex-wrap: wrap; gap: 4px; overflow: visible;"

  if (currentAnime.genre && currentAnime.genre.trim() !== "") {
    const genres = currentAnime.genre.split(",").map((g) => g.trim()).filter((g) => g)
    genres.forEach((genre) => {
      const badge = document.createElement("span")
      badge.className = "genre-badge"
      badge.textContent = genre
      genresContainer.appendChild(badge)
    })
  }
}

function displayEpisodeList() {
  const container = document.getElementById("watchEpisodeListContainer")
  const totalEpisodes = document.getElementById("totalEpisodes")

  totalEpisodes.textContent = allEpisodes.length
  container.innerHTML = ""

  allEpisodes.forEach((ep) => {
    const episodeItem = document.createElement("div")
    episodeItem.className = "watch-episode-item" + (ep.slug === currentEpisodeSlug ? " active" : "")
    episodeItem.innerHTML = `
      <span class="episode-num">Ep ${ep.episode_number}</span>
      <span class="episode-title">${ep.title || "Episode"}</span>
    `
    episodeItem.addEventListener("click", () => {
      window.location.href = `watch.html?anime=${currentAnimeSlug}&episode=${ep.slug}&num=${ep.episode_number}`
    })
    container.appendChild(episodeItem)
  })
}

function saveContinueWatching() {
  const continueData = JSON.parse(localStorage.getItem('continueWatching') || '{}')

  continueData[currentAnimeSlug] = {
    episodeSlug: currentEpisodeSlug,
    episodeNumber: currentEpisodeNumber,
    animeName: currentAnime.name,
    animeImage: currentAnime.image_url,
    timestamp: new Date().toISOString()
  }

  localStorage.setItem('continueWatching', JSON.stringify(continueData))
}

function updateNavigationButtons() {
  const currentIndex = allEpisodes.findIndex(ep => ep.slug === currentEpisodeSlug)

  const prevBtn = document.getElementById('prevEpisodeBtn')
  const nextBtn = document.getElementById('nextEpisodeBtn')

  if (currentIndex <= 0) {
    prevBtn.disabled = true
    prevBtn.style.opacity = '0.5'
    prevBtn.style.cursor = 'not-allowed'
  } else {
    prevBtn.disabled = false
    prevBtn.style.opacity = '1'
    prevBtn.style.cursor = 'pointer'
  }

  if (currentIndex >= allEpisodes.length - 1) {
    nextBtn.disabled = true
    nextBtn.style.opacity = '0.5'
    nextBtn.style.cursor = 'not-allowed'
  } else {
    nextBtn.disabled = false
    nextBtn.style.opacity = '1'
    nextBtn.style.cursor = 'pointer'
  }
}

function previousEpisode() {
  const currentIndex = allEpisodes.findIndex(ep => ep.slug === currentEpisodeSlug)

  if (currentIndex > 0) {
    const prevEp = allEpisodes[currentIndex - 1]
    window.location.href = `watch.html?anime=${currentAnimeSlug}&episode=${prevEp.slug}&num=${prevEp.episode_number}`
  }
}

function nextEpisode() {
  const currentIndex = allEpisodes.findIndex(ep => ep.slug === currentEpisodeSlug)

  if (currentIndex < allEpisodes.length - 1) {
    const nextEp = allEpisodes[currentIndex + 1]
    window.location.href = `watch.html?anime=${currentAnimeSlug}&episode=${nextEp.slug}&num=${nextEp.episode_number}`
  }
}

function shareEpisode() {
  const url = window.location.href
  const text = `Nonton ${currentAnime.name} Episode ${currentEpisodeNumber} di Zeeniatt!`

  if (navigator.share) {
    navigator.share({
      title: `${currentAnime.name} - Episode ${currentEpisodeNumber}`,
      text: text,
      url: url
    }).catch(err => console.log('Error sharing:', err))
  } else {
    navigator.clipboard.writeText(url).then(() => {
      showNotification('Link episode disalin ke clipboard!')
    })
  }
}

let isDarkMode = localStorage.getItem('darkMode') === 'true'

function toggleDarkMode() {
  isDarkMode = !isDarkMode
  localStorage.setItem('darkMode', isDarkMode)

  const themeIcon = document.getElementById('themeIcon')

  if (isDarkMode) {
    document.body.style.background = 'linear-gradient(135deg, #000000 0%, #0a0a0a 100%)'
    themeIcon.className = 'bi bi-sun-fill theme-icon'
    showNotification('Dark mode aktif')
  } else {
    document.body.style.background = 'linear-gradient(135deg, #0a0e1a 0%, #1a1226 100%)'
    themeIcon.className = 'bi bi-moon-fill theme-icon'
    showNotification('Light mode aktif')
  }
}

function initDarkMode() {
  const themeIcon = document.getElementById('themeIcon')

  if (isDarkMode) {
    document.body.style.background = 'linear-gradient(135deg, #000000 0%, #0a0a0a 100%)'
    themeIcon.className = 'bi bi-sun-fill theme-icon'
  } else {
    document.body.style.background = 'linear-gradient(135deg, #0a0e1a 0%, #1a1226 100%)'
    themeIcon.className = 'bi bi-moon-fill theme-icon'
  }
}

function showNotification(message) {
  const notification = document.createElement('div')
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: rgba(26, 28, 34, 0.95);
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    border: 1px solid rgba(220, 38, 38, 0.4);
    z-index: 9999;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    animation: slideIn 0.3s ease;
  `
  notification.textContent = message

  const style = document.createElement('style')
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(400px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(400px); opacity: 0; }
    }
  `
  document.head.appendChild(style)

  document.body.appendChild(notification)

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease'
    setTimeout(() => notification.remove(), 300)
  }, 3000)
}

initDarkMode()
loadWatchPage()
