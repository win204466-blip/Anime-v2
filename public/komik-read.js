const API_BASE = window.location.origin
let currentKomikSlug = null
let currentChapterSlug = null
let chapterNavigation = null

function goBack() {
  window.location.href = `komik-detail.html?slug=${currentKomikSlug}`
}

async function loadReadPage() {
  const urlParams = new URLSearchParams(window.location.search)
  currentKomikSlug = urlParams.get('komik')
  currentChapterSlug = urlParams.get('chapter')

  if (!currentKomikSlug || !currentChapterSlug) {
    window.location.href = 'komik.html'
    return
  }

  try {
    const response = await fetch(`${API_BASE}/api/komik/chapter/${currentChapterSlug}`)
    const result = await response.json()

    if (!result.success) {
      alert("Gagal memuat chapter")
      window.location.href = `komik-detail.html?slug=${currentKomikSlug}`
      return
    }

    displayChapter(result.data)
    chapterNavigation = result.data.navigation
    updateNavigationButtons()

    document.title = `${result.data.chapterTitle} - Zeeniatt`
  } catch (error) {
    console.error("Error loading chapter:", error)
    alert("Gagal memuat chapter")
    window.location.href = 'komik.html'
  }
}

function displayChapter(chapterData) {
  document.getElementById("chapterTitle").textContent = chapterData.chapterTitle || "Chapter"
  document.getElementById("komikTitle").textContent = chapterData.mangaTitle || ""

  const imagesContainer = document.getElementById("readerImages")

  if (chapterData.images && chapterData.images.length > 0) {
    imagesContainer.innerHTML = chapterData.images.map((imgUrl, index) => 
      `<img src="${imgUrl}" alt="Page ${index + 1}" loading="lazy" onerror="this.style.display='none'">`
    ).join('')
  } else {
    imagesContainer.innerHTML = '<div class="text-center text-light">Tidak ada gambar tersedia</div>'
  }
}

function updateNavigationButtons() {
  const prevBtn = document.getElementById('prevChapterBtn')
  const nextBtn = document.getElementById('nextChapterBtn')

  if (!chapterNavigation) {
    prevBtn.disabled = true
    nextBtn.disabled = true
    return
  }

  if (!chapterNavigation.prevChapter) {
    prevBtn.disabled = true
    prevBtn.style.opacity = '0.4'
  } else {
    prevBtn.disabled = false
    prevBtn.style.opacity = '1'
  }

  if (!chapterNavigation.nextChapter) {
    nextBtn.disabled = true
    nextBtn.style.opacity = '0.4'
  } else {
    nextBtn.disabled = false
    nextBtn.style.opacity = '1'
  }
}

function previousChapter() {
  if (chapterNavigation && chapterNavigation.prevChapter) {
    window.location.href = `komik-read.html?komik=${currentKomikSlug}&chapter=${chapterNavigation.prevChapter}`
  }
}

function nextChapter() {
  if (chapterNavigation && chapterNavigation.nextChapter) {
    window.location.href = `komik-read.html?komik=${currentKomikSlug}&chapter=${chapterNavigation.nextChapter}`
  }
}

loadReadPage()
