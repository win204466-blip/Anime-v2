const API_BASE = window.location.origin
let currentAnime = null
let currentAnimeSlug = null

function toggleMenu() {
  const menu = document.getElementById("sidebarMenu")
  const overlay = document.getElementById("sidebarOverlay")
  const mainContent = document.getElementById("mainContent")

  menu.classList.toggle("active")
  overlay.classList.toggle("active")
  mainContent.classList.toggle("shifted")
}

function toggleSearch() {
  const searchBox = document.getElementById("toggleSearch")
  searchBox.classList.toggle("active")
  if (searchBox.classList.contains("active")) {
    document.getElementById("searchInput").focus()
  }
}

function goToAbout() {
  document.getElementById("page-about").style.display = "block"
  document.getElementById("animeDetail").parentElement.style.display = "none"
  document.getElementById("episodeList").style.display = "none"
  toggleMenu()
}

function goToSupport() {
  document.getElementById("page-support").style.display = "block"
  document.getElementById("animeDetail").parentElement.style.display = "none"
  document.getElementById("episodeList").style.display = "none"
  toggleMenu()
}

function hideAbout() {
  document.getElementById("page-about").style.display = "none"
  document.getElementById("animeDetail").parentElement.style.display = "block"
  document.getElementById("episodeList").style.display = "block"
}

function hideSupport() {
  document.getElementById("page-support").style.display = "none"
  document.getElementById("animeDetail").parentElement.style.display = "block"
  document.getElementById("episodeList").style.display = "block"
}

async function loadDetailPage() {
  const urlParams = new URLSearchParams(window.location.search)
  currentAnimeSlug = urlParams.get('slug')

  if (!currentAnimeSlug) {
    window.location.href = 'index.html'
    return
  }

  try {
    const response = await fetch(`${API_BASE}/api/anime/${currentAnimeSlug}`)
    const result = await response.json()

    if (!result.success) {
      alert('Gagal memuat detail anime')
      window.location.href = 'index.html'
      return
    }

    currentAnime = result.data
    displayAnimeDetail()
    displayEpisodeList()
    checkFavoriteStatus()

    document.title = `${currentAnime.name || currentAnime.title} - Zeeniatt`
  } catch (error) {
    console.error('Error loading anime detail:', error)
    alert('Gagal memuat detail anime')
    window.location.href = 'index.html'
  }
}

function displayAnimeDetail() {
  const detailContainer = document.getElementById('animeDetail')

  const genres = (currentAnime.genre || currentAnime.genres || '').split(',').filter(g => g.trim()).map(g => 
    `<span class="genre-badge">${g.trim()}</span>`
  ).join(' ')

  detailContainer.innerHTML = `
    <div class="row">
      <div class="col-md-4 mb-3">
        <img src="${currentAnime.image_url || currentAnime.image}" alt="${currentAnime.name || currentAnime.title}" 
             class="w-100" style="border-radius: 12px; max-height: 400px; object-fit: cover;"
             onerror="this.src='https://via.placeholder.com/300x400?text=No+Image'">
      </div>
      <div class="col-md-8">
        <h2 class="mb-3">${currentAnime.name || currentAnime.title}</h2>
        <div class="anime-info-box mb-3">
          <div class="anime-info-item">
            <i class="bi bi-star-fill"></i>
            <span>Rating: ${currentAnime.rating || 'N/A'}</span>
          </div>
          <div class="anime-info-item">
            <i class="bi bi-info-circle"></i>
            <span>Status: ${currentAnime.status || 'Tidak diketahui'}</span>
          </div>
          <div class="anime-info-item">
            <i class="bi bi-tv-fill"></i>
            <span>Tipe: ${currentAnime.type || 'TV'}</span>
          </div>
          <div class="anime-info-item">
            <i class="bi bi-building"></i>
            <span>Studio: ${currentAnime.studio || 'Tidak diketahui'}</span>
          </div>
          <div class="anime-info-item">
            <i class="bi bi-person-badge"></i>
            <span>Producer: ${currentAnime.producer || 'Tidak diketahui'}</span>
          </div>
          <div class="anime-info-item">
            <i class="bi bi-calendar-event"></i>
            <span>Rilis: ${currentAnime.release_date || 'Tidak diketahui'}</span>
          </div>
          <div class="anime-info-item">
            <i class="bi bi-collection-play"></i>
            <span>Episode: ${currentAnime.total_episodes || currentAnime.episodes?.length || 0}</span>
          </div>
        </div>
        ${genres ? `<div class="mb-3">${genres}</div>` : ''}
        <p class="text-light">${currentAnime.description || 'Tidak ada deskripsi'}</p>
      </div>
    </div>
  `
}

function displayEpisodeList() {
  const episodeListContainer = document.getElementById('episodeList')

  if (!currentAnime.episodes || currentAnime.episodes.length === 0) {
    episodeListContainer.innerHTML = `
      <h5 class="mb-3"><i class="bi bi-collection-play me-2"></i>Episode</h5>
      <p class="text-light">Tidak ada episode tersedia</p>
    `
    return
  }

  let episodesHTML = `
    <h5 class="mb-3"><i class="bi bi-collection-play me-2"></i>Episode (${currentAnime.episodes.length})</h5>
    <div style="max-height: 500px; overflow-y: auto;">
  `

  currentAnime.episodes.forEach((episode) => {
    episodesHTML += `
      <div class="episode-item" onclick="watchEpisode('${episode.slug}', '${episode.episode_number}')">
        <div>
          <div style="font-weight: 600; color: #ffffff;">Episode ${episode.episode_number}</div>
          <div style="font-size: 0.85rem; color: #b0b0c0;">${episode.title || ''}</div>
        </div>
        <i class="bi bi-play-circle-fill" style="font-size: 1.5rem; color: #dc2626;"></i>
      </div>
    `
  })

  episodesHTML += '</div>'
  episodeListContainer.innerHTML = episodesHTML
}

function watchEpisode(episodeSlug, episodeNumber) {
  window.location.href = `watch.html?anime=${currentAnimeSlug}&episode=${episodeSlug}&num=${episodeNumber}`
}

function toggleFavorite() {
  const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
  const index = favorites.findIndex(f => f.slug === currentAnimeSlug)

  if (index > -1) {
    favorites.splice(index, 1)
    showNotification('Dihapus dari favorit')
  } else {
    favorites.push({
      slug: currentAnimeSlug,
      name: currentAnime.name || currentAnime.title,
      image_url: currentAnime.image_url || currentAnime.image
    })
    showNotification('Ditambahkan ke favorit')
  }

  localStorage.setItem('favorites', JSON.stringify(favorites))
  checkFavoriteStatus()
}

function checkFavoriteStatus() {
  const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
  const isFavorite = favorites.some(f => f.slug === currentAnimeSlug)

  const icon = document.getElementById('favoriteIcon')
  const text = document.getElementById('favoriteText')

  if (isFavorite) {
    icon.style.color = '#dc2626'
    text.textContent = 'Hapus dari Favorit'
  } else {
    icon.style.color = ''
    text.textContent = 'Tambah ke Favorit'
  }
}

function shareAnime() {
  const url = window.location.href
  const animeTitle = currentAnime.name || currentAnime.title
  const text = `Nonton ${animeTitle} di Zeeniatt!`

  if (navigator.share) {
    navigator.share({
      title: animeTitle,
      text: text,
      url: url
    }).catch(err => console.log('Error sharing:', err))
  } else {
    navigator.clipboard.writeText(url).then(() => {
      showNotification('Link disalin ke clipboard!')
    })
  }
}

function downloadEpisodeList() {
  if (!currentAnime.episodes || currentAnime.episodes.length === 0) {
    showNotification('Tidak ada episode untuk diunduh')
    return
  }

  const animeTitle = currentAnime.name || currentAnime.title
  let content = `${animeTitle}\n\nDaftar Episode:\n\n`
  currentAnime.episodes.forEach(ep => {
    content += `Episode ${ep.episode_number}: ${ep.title || '-'}\n`
  })

  const blob = new Blob([content], { type: 'text/plain' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${animeTitle} - Episode List.txt`
  a.click()
  window.URL.revokeObjectURL(url)
  showNotification('Daftar episode berhasil diunduh')
}

async function searchAnime() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim()

  if (searchTerm === "") return

  window.location.href = `index.html?search=${encodeURIComponent(searchTerm)}`
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
  `
  notification.textContent = message
  document.body.appendChild(notification)

  setTimeout(() => notification.remove(), 3000)
}

loadDetailPage()
