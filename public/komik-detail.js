const API_BASE = window.location.origin
let currentKomik = null
let currentKomikSlug = null

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
  document.getElementById("komikDetail").parentElement.style.display = "none"
  document.getElementById("chapterList").style.display = "none"
  toggleMenu()
}

function goToSupport() {
  document.getElementById("page-support").style.display = "block"
  document.getElementById("komikDetail").parentElement.style.display = "none"
  document.getElementById("chapterList").style.display = "none"
  toggleMenu()
}

function hideAbout() {
  document.getElementById("page-about").style.display = "none"
  document.getElementById("komikDetail").parentElement.style.display = "block"
  document.getElementById("chapterList").style.display = "block"
}

function hideSupport() {
  document.getElementById("page-support").style.display = "none"
  document.getElementById("komikDetail").parentElement.style.display = "block"
  document.getElementById("chapterList").style.display = "block"
}

async function loadDetailPage() {
  const urlParams = new URLSearchParams(window.location.search)
  currentKomikSlug = urlParams.get('slug')

  if (!currentKomikSlug) {
    window.location.href = 'komik.html'
    return
  }

  try {
    const response = await fetch(`${API_BASE}/api/komik/${currentKomikSlug}`)
    const result = await response.json()

    if (!result.success) {
      alert('Gagal memuat detail komik')
      window.location.href = 'komik.html'
      return
    }

    currentKomik = result.data
    displayKomikDetail()
    displayChapterList()
    checkFavoriteStatus()

    document.title = `${currentKomik.title} - Zeeniatt`
  } catch (error) {
    console.error('Error loading komik detail:', error)
    alert('Gagal memuat detail komik')
    window.location.href = 'komik.html'
  }
}

function displayKomikDetail() {
  const detailContainer = document.getElementById('komikDetail')

  const genres = (currentKomik.genres || []).map(g => 
    `<span class="genre-badge">${g}</span>`
  ).join(' ')

  detailContainer.innerHTML = `
    <div class="row">
      <div class="col-md-4 mb-3">
        <img src="${currentKomik.thumbnail}" alt="${currentKomik.title}" 
             class="w-100" style="border-radius: 12px; max-height: 400px; object-fit: cover;"
             onerror="this.src='https://via.placeholder.com/300x400?text=No+Image'">
      </div>
      <div class="col-md-8">
        <h2 class="mb-3">${currentKomik.title}</h2>
        ${currentKomik.alternativeTitle ? `<p class="text-light small mb-2">${currentKomik.alternativeTitle}</p>` : ''}
        <div class="anime-info-box mb-3">
          <div class="anime-info-item">
            <i class="bi bi-info-circle"></i>
            <span>Status: ${currentKomik.status || 'Tidak diketahui'}</span>
          </div>
          <div class="anime-info-item">
            <i class="bi bi-collection-play"></i>
            <span>Tipe: ${currentKomik.type || 'Komik'}</span>
          </div>
          <div class="anime-info-item">
            <i class="bi bi-person-fill"></i>
            <span>Pengarang: ${currentKomik.author || 'Tidak diketahui'}</span>
          </div>
          <div class="anime-info-item">
            <i class="bi bi-collection-play"></i>
            <span>Chapter: ${currentKomik.totalChapters || 0}</span>
          </div>
        </div>
        ${genres ? `<div class="mb-3" style="display: flex; flex-wrap: wrap; gap: 4px;">${genres}</div>` : ''}
        <p class="text-light">${currentKomik.synopsis || 'Tidak ada sinopsis'}</p>
      </div>
    </div>
  `
}

function displayChapterList() {
  const chapterListContainer = document.getElementById('chapterList')

  if (!currentKomik.chapters || currentKomik.chapters.length === 0) {
    chapterListContainer.innerHTML = `
      <h5 class="mb-3"><i class="bi bi-collection-play me-2"></i>Chapter</h5>
      <p class="text-light">Tidak ada chapter tersedia</p>
    `
    return
  }

  let chaptersHTML = `
    <h5 class="mb-3"><i class="bi bi-collection-play me-2"></i>Chapter (${currentKomik.chapters.length})</h5>
    <div style="max-height: 500px; overflow-y: auto;">
  `

  currentKomik.chapters.forEach((chapter) => {
    chaptersHTML += `
      <div class="episode-item" onclick="readChapter('${chapter.slug}')">
        <div>
          <div style="font-weight: 600; color: #ffffff;">${chapter.chapter}</div>
          ${chapter.title ? `<div style="font-size: 0.85rem; color: #b0b0c0;">${chapter.title}</div>` : ''}
        </div>
        <i class="bi bi-book-fill" style="font-size: 1.5rem; color: #dc2626;"></i>
      </div>
    `
  })

  chaptersHTML += '</div>'
  chapterListContainer.innerHTML = chaptersHTML
}

function readChapter(chapterSlug) {
  window.location.href = `komik-read.html?komik=${currentKomikSlug}&chapter=${chapterSlug}`
}

function toggleFavorite() {
  const favorites = JSON.parse(localStorage.getItem('komikFavorites') || '[]')
  const index = favorites.findIndex(f => f.slug === currentKomikSlug)

  if (index > -1) {
    favorites.splice(index, 1)
    showNotification('Dihapus dari favorit')
  } else {
    favorites.push({
      slug: currentKomikSlug,
      title: currentKomik.title,
      thumbnail: currentKomik.thumbnail
    })
    showNotification('Ditambahkan ke favorit')
  }

  localStorage.setItem('komikFavorites', JSON.stringify(favorites))
  checkFavoriteStatus()
}

function checkFavoriteStatus() {
  const favorites = JSON.parse(localStorage.getItem('komikFavorites') || '[]')
  const isFavorite = favorites.some(f => f.slug === currentKomikSlug)

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

function shareKomik() {
  const url = window.location.href
  const komikTitle = currentKomik.title
  const text = `Baca ${komikTitle} di Zeeniatt!`

  if (navigator.share) {
    navigator.share({
      title: komikTitle,
      text: text,
      url: url
    }).catch(err => console.log('Error sharing:', err))
  } else {
    navigator.clipboard.writeText(url).then(() => {
      showNotification('Link disalin ke clipboard!')
    })
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
    border: 1px solid rgba(34, 197, 94, 0.4);
    z-index: 9999;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  `
  notification.textContent = message
  document.body.appendChild(notification)
  setTimeout(() => notification.remove(), 3000)
}

loadDetailPage()
