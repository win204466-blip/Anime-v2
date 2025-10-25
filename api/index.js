const express = require("express")
const cors = require("cors")
const axios = require("axios")
const cheerio = require("cheerio")
const path = require("path")

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, "../public")))

const BASE_URL = "https://oploverz.ch"
const DONGHUA_BASE_URL = "https://donghuaid.live"

async function fetchPage(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      timeout: 8000,
    })
    return cheerio.load(response.data)
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message)
    throw error
  }
}

function extractSlug(url) {
  if (!url) return ""
  const parts = url.split("/").filter(Boolean)
  return parts[parts.length - 1] || ""
}

function extractReleaseDate($, html) {
  let releaseDate = ""

  // Try multiple selectors and patterns
  const selectors = [".info-content", ".spe span", ".entry-content", ".anime-info", ".data"]

  for (const selector of selectors) {
    $(selector).each((i, elem) => {
      const text = $(elem).text()

      // Indonesian month names
      const indonesianMonths = "Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember"
      // English month names
      const englishMonths = "January|February|March|April|May|June|July|August|September|October|November|December"

      const dateRegex = new RegExp(`(\\d{1,2})\\s+(${indonesianMonths}|${englishMonths})\\s+(\\d{4})`, "i")

      const match = text.match(dateRegex)
      if (match && !releaseDate) {
        releaseDate = match[0]
      }
    })

    if (releaseDate) break
  }

  // If still not found, try to extract from any text containing date patterns
  if (!releaseDate) {
    const bodyText = $("body").text()
    const indonesianMonths = "Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember"
    const englishMonths = "January|February|March|April|May|June|July|August|September|October|November|December"
    const dateRegex = new RegExp(`(\\d{1,2})\\s+(${indonesianMonths}|${englishMonths})\\s+(\\d{4})`, "i")
    const match = bodyText.match(dateRegex)
    if (match) {
      releaseDate = match[0]
    }
  }

  return releaseDate || "Tidak diketahui"
}

app.get("/api/home", async (req, res) => {
  try {
    const $ = await fetchPage(BASE_URL)
    const animes = []

    $(".bsx").each((i, elem) => {
      let title = $(elem).find(".tt").text().trim() || $(elem).find("a").attr("title")
      const link = $(elem).find("a").attr("href")
      const image = $(elem).find("img").attr("src") || $(elem).find("img").attr("data-src")

      if (title) {
        title = title.split("\t")[0].trim()
      }

      if (title && link && link.includes("/series/")) {
        const slug = extractSlug(link)
        animes.push({
          id: slug,
          name: title,
          slug: slug,
          image_url: image || "https://via.placeholder.com/300x400?text=No+Image",
          url: link,
        })
      }
    })

    res.json({ success: true, data: animes })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get("/api/anime/:slug", async (req, res) => {
  try {
    const { slug } = req.params
    const url = `${BASE_URL}/series/${slug}/`
    const $ = await fetchPage(url)

    const title = $(".entry-title").text().trim() || $("h1").first().text().trim()
    const image = $(".thumb img").attr("src") || $(".wp-post-image").attr("src") || $("img").first().attr("src")
    const description = $(".entry-content p").first().text().trim() || $(".desc").text().trim() || $(".synopsis p").text().trim()

    const genre = []
    $(".genre-info a, .genxed a").each((i, elem) => {
      genre.push($(elem).text().trim())
    })

    const releaseDate = extractReleaseDate($, $.html())

    let rating = ""
    let studio = ""
    let status = ""
    let type = ""
    let producer = ""
    let totalEpisodes = ""

    $(".info-content .spe span").each((i, elem) => {
      const text = $(elem).text().trim()
      const label = $(elem).find("b").text().trim().toLowerCase()
      
      if (text.includes("Rating") || label.includes("rating") || text.includes("Score")) {
        rating = text.replace(/Rating\s*:?\s*/i, "").replace(/Score\s*:?\s*/i, "").trim()
      } else if (text.includes("Studio") || label.includes("studio")) {
        studio = text.replace(/Studio\s*:?\s*/i, "").trim()
      } else if (text.includes("Status") || label.includes("status")) {
        status = text.replace(/Status\s*:?\s*/i, "").trim()
      } else if (text.includes("Type") || label.includes("type") || text.includes("Tipe")) {
        type = text.replace(/Type\s*:?\s*/i, "").replace(/Tipe\s*:?\s*/i, "").trim()
      } else if (text.includes("Producer") || label.includes("producer")) {
        producer = text.replace(/Producer\s*:?\s*/i, "").trim()
      } else if (text.includes("Episodes") || label.includes("episode")) {
        totalEpisodes = text.replace(/Episodes?\s*:?\s*/i, "").trim()
      }
    })

    if (!rating) {
      const ratingText = $("strong:contains('Rating')").parent().text() || $(".rating").text() || $("span.score").text()
      rating = ratingText.replace(/Rating\s*:?\s*/i, "").replace(/Score\s*:?\s*/i, "").trim()
    }

    if (!studio) {
      studio = $(".studio a").text().trim() || $("a[href*='/studio/']").first().text().trim()
    }

    if (!status) {
      status = $(".status").text().trim() || $("strong:contains('Status')").parent().text().replace(/Status\s*:?\s*/i, "").trim()
    }

    if (!type) {
      type = $(".type").text().trim() || $("strong:contains('Type')").parent().text().replace(/Type\s*:?\s*/i, "").replace(/Tipe\s*:?\s*/i, "").trim()
    }

    const episodes = []
    $(".eplister ul li, .episodelist li").each((i, elem) => {
      const episodeLink = $(elem).find("a").attr("href")
      const episodeTitle = $(elem).find(".epl-title, .lchx a").text().trim()
      const episodeNum = $(elem).find(".epl-num").text().trim()

      if (episodeLink) {
        const episodeSlug = episodeLink.split("/").filter(Boolean).pop()
        episodes.push({
          episode_number: episodeNum || episodes.length + 1,
          title: episodeTitle || `Episode ${episodes.length + 1}`,
          slug: episodeSlug,
          url: episodeLink,
        })
      }
    })

    episodes.reverse()

    res.json({
      success: true,
      data: {
        name: title,
        slug: slug,
        image_url: image || "https://via.placeholder.com/600x220?text=No+Image",
        description: description || "Tidak ada deskripsi",
        genre: genre.join(", "),
        release_date: releaseDate,
        rating: rating || "N/A",
        studio: studio || "Tidak diketahui",
        status: status || "Tidak diketahui",
        type: type || "TV",
        producer: producer || "Tidak diketahui",
        total_episodes: totalEpisodes || episodes.length.toString(),
        episodes: episodes,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get("/api/episode/:slug", async (req, res) => {
  try {
    const { slug } = req.params
    const url = `${BASE_URL}/${slug}/`
    const $ = await fetchPage(url)

    let streamingUrl = ""

    $("iframe").each((i, elem) => {
      const src = $(elem).attr("src")
      if (src && (src.includes("stream") || src.includes("player") || src.includes("embed"))) {
        streamingUrl = src
        return false
      }
    })

    if (!streamingUrl) {
      const scripts = $("script")
        .map((i, el) => $(el).html())
        .get()
      for (const script of scripts) {
        if (script && script.includes("iframe")) {
          const match = script.match(/src=["']([^"']+)["']/)
          if (match) {
            streamingUrl = match[1]
            break
          }
        }
      }
    }

    if (!streamingUrl) {
      streamingUrl = $(".player-embed iframe, .video-content iframe, #pembed iframe").attr("src")
    }

    const episodeTitle = $(".entry-title").text().trim() || $("h1").first().text().trim()

    res.json({
      success: true,
      data: {
        title: episodeTitle,
        slug: slug,
        streaming_url: streamingUrl || "",
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get("/api/list", async (req, res) => {
  try {
    const url = `${BASE_URL}/series/list-mode/`
    const $ = await fetchPage(url)
    const animes = []

    $(".bsx, .listupd .bs").each((i, elem) => {
      let title = $(elem).find(".tt, .title").text().trim() || $(elem).find("a").attr("title")
      const link = $(elem).find("a").attr("href")
      const image = $(elem).find("img").attr("src") || $(elem).find("img").attr("data-src")

      if (title) {
        title = title.split("\t")[0].trim()
      }

      if (title && link) {
        const slug = extractSlug(link)
        animes.push({
          id: slug,
          name: title,
          slug: slug,
          image_url: image || "https://via.placeholder.com/300x400?text=No+Image",
          url: link,
        })
      }
    })

    res.json({ success: true, data: animes })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get("/api/popular", async (req, res) => {
  try {
    const url = `${BASE_URL}/series/?status=&type=&order=popular`
    const $ = await fetchPage(url)
    const animes = []

    $(".bsx").each((i, elem) => {
      let title = $(elem).find(".tt").text().trim() || $(elem).find("a").attr("title")
      const link = $(elem).find("a").attr("href")
      const image = $(elem).find("img").attr("src") || $(elem).find("img").attr("data-src")

      if (title) {
        title = title.split("\t")[0].trim()
      }

      if (title && link) {
        const slug = extractSlug(link)
        animes.push({
          id: slug,
          name: title,
          slug: slug,
          image_url: image || "https://via.placeholder.com/300x400?text=No+Image",
          url: link,
        })
      }
    })

    res.json({ success: true, data: animes })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get("/api/search", async (req, res) => {
  try {
    const { q } = req.query
    if (!q) {
      return res.json({ success: true, data: [] })
    }

    const url = `${BASE_URL}/?s=${encodeURIComponent(q)}`
    const $ = await fetchPage(url)
    const animes = []

    $(".bsx").each((i, elem) => {
      let title = $(elem).find(".tt").text().trim() || $(elem).find("a").attr("title")
      const link = $(elem).find("a").attr("href")
      const image = $(elem).find("img").attr("src") || $(elem).find("img").attr("data-src")

      if (title) {
        title = title.split("\t")[0].trim()
      }

      if (title && link && link.includes("/series/")) {
        const slug = extractSlug(link)
        animes.push({
          id: slug,
          name: title,
          slug: slug,
          image_url: image || "https://via.placeholder.com/300x400?text=No+Image",
          url: link,
        })
      }
    })

    res.json({ success: true, data: animes })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get("/api/donghua/list", async (req, res) => {
  try {
    const url = `${DONGHUA_BASE_URL}/anime/list-mode/`
    const $ = await fetchPage(url)
    const donghuas = []

    $(".bsx, .listupd .bs").each((i, elem) => {
      let title = $(elem).find(".tt, .title").text().trim() || $(elem).find("a").attr("title")
      const link = $(elem).find("a").attr("href")
      const image = $(elem).find("img").attr("src") || $(elem).find("img").attr("data-src")

      if (title) {
        title = title.split("\t")[0].trim()
      }

      if (title && link && link.includes("/anime/")) {
        const slug = extractSlug(link)
        donghuas.push({
          id: slug,
          name: title,
          slug: slug,
          image_url: image || "https://via.placeholder.com/300x400?text=No+Image",
          url: link,
        })
      }
    })

    res.json({ success: true, data: donghuas })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get("/api/donghua/popular", async (req, res) => {
  try {
    const url = `${DONGHUA_BASE_URL}/anime/?status=&type=&order=popular`
    const $ = await fetchPage(url)
    const donghuas = []

    $(".bsx").each((i, elem) => {
      let title = $(elem).find(".tt").text().trim() || $(elem).find("a").attr("title")
      const link = $(elem).find("a").attr("href")
      const image = $(elem).find("img").attr("src") || $(elem).find("img").attr("data-src")

      if (title) {
        title = title.split("\t")[0].trim()
      }

      if (title && link && link.includes("/anime/")) {
        const slug = extractSlug(link)
        donghuas.push({
          id: slug,
          name: title,
          slug: slug,
          image_url: image || "https://via.placeholder.com/300x400?text=No+Image",
          url: link,
        })
      }
    })

    res.json({ success: true, data: donghuas })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get("/api/donghua/:slug", async (req, res) => {
  try {
    const { slug } = req.params
    const url = `${DONGHUA_BASE_URL}/anime/${slug}/`
    const $ = await fetchPage(url)

    const title = $(".entry-title").text().trim() || $("h1").first().text().trim()
    const image = $(".thumb img").attr("src") || $(".wp-post-image").attr("src") || $("img").first().attr("src")
    const description = $(".entry-content p").first().text().trim() || $(".desc").text().trim() || $(".synopsis p").text().trim()

    const genre = []
    $(".genre-info a, .genxed a").each((i, elem) => {
      genre.push($(elem).text().trim())
    })

    const releaseDate = extractReleaseDate($, $.html())

    let rating = ""
    let studio = ""
    let status = ""
    let type = ""
    let duration = ""
    let totalEpisodes = ""

    $(".info-content .spe span").each((i, elem) => {
      const text = $(elem).text().trim()
      const label = $(elem).find("b").text().trim().toLowerCase()
      
      if (text.includes("Rating") || label.includes("rating")) {
        rating = text.replace(/Rating\s*:?\s*/i, "").trim()
      } else if (text.includes("Studio") || label.includes("studio")) {
        studio = text.replace(/Studio\s*:?\s*/i, "").trim()
      } else if (text.includes("Status") || label.includes("status")) {
        status = text.replace(/Status\s*:?\s*/i, "").trim()
      } else if (text.includes("Type") || label.includes("type") || text.includes("Tipe")) {
        type = text.replace(/Type\s*:?\s*/i, "").replace(/Tipe\s*:?\s*/i, "").trim()
      } else if (text.includes("Duration") || label.includes("duration") || text.includes("Durasi")) {
        duration = text.replace(/Duration\s*:?\s*/i, "").replace(/Durasi\s*:?\s*/i, "").trim()
      } else if (text.includes("Episodes") || label.includes("episode")) {
        totalEpisodes = text.replace(/Episodes?\s*:?\s*/i, "").trim()
      }
    })

    if (!rating) {
      const ratingText = $("strong:contains('Rating')").parent().text() || $(".rating").text()
      rating = ratingText.replace(/Rating\s*:?\s*/i, "").trim()
    }

    if (!studio) {
      studio = $(".studio a").text().trim() || $("a[href*='/studio/']").first().text().trim()
    }

    if (!status) {
      status = $(".status").text().trim() || $("strong:contains('Status')").parent().text().replace(/Status\s*:?\s*/i, "").trim()
    }

    if (!type) {
      type = $(".type").text().trim() || $("strong:contains('Type')").parent().text().replace(/Type\s*:?\s*/i, "").replace(/Tipe\s*:?\s*/i, "").trim()
    }

    const episodes = []
    $(".eplister ul li, .episodelist li").each((i, elem) => {
      const episodeLink = $(elem).find("a").attr("href")
      const episodeTitle = $(elem).find(".epl-title, .lchx a").text().trim()
      const episodeNum = $(elem).find(".epl-num").text().trim()

      if (episodeLink) {
        const episodeSlug = episodeLink.split("/").filter(Boolean).pop()
        episodes.push({
          episode_number: episodeNum || episodes.length + 1,
          title: episodeTitle || `Episode ${episodes.length + 1}`,
          slug: episodeSlug,
          url: episodeLink,
        })
      }
    })

    episodes.reverse()

    res.json({
      success: true,
      data: {
        name: title,
        slug: slug,
        image_url: image || "https://via.placeholder.com/600x220?text=No+Image",
        description: description || "Tidak ada deskripsi",
        genre: genre.join(", "),
        release_date: releaseDate,
        rating: rating || "N/A",
        studio: studio || "Tidak diketahui",
        status: status || "Tidak diketahui",
        type: type || "ONA",
        duration: duration || "Tidak diketahui",
        total_episodes: totalEpisodes || episodes.length.toString(),
        episodes: episodes,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get("/api/donghua/episode/:slug", async (req, res) => {
  try {
    const { slug } = req.params
    const url = `${DONGHUA_BASE_URL}/${slug}/`
    const $ = await fetchPage(url)

    let streamingUrl = ""
    const videoServers = []

    $("select#selectserver option, .server-list option, option[value*='http']").each((i, elem) => {
      const serverName = $(elem).text().trim()
      const serverUrl = $(elem).attr("value") || $(elem).attr("data-url")
      
      if (serverUrl && serverUrl.startsWith("http")) {
        videoServers.push({
          name: serverName || `Server ${i + 1}`,
          url: serverUrl
        })
      }
    })

    $("iframe").each((i, elem) => {
      const src = $(elem).attr("src")
      if (src && (src.includes("stream") || src.includes("player") || src.includes("embed"))) {
        if (!streamingUrl) streamingUrl = src
        
        const serverId = $(elem).attr("id") || $(elem).attr("data-server") || `server-${i + 1}`
        const isAlreadyAdded = videoServers.some(s => s.url === src)
        if (!isAlreadyAdded) {
          videoServers.push({
            name: serverId.charAt(0).toUpperCase() + serverId.slice(1).replace(/-/g, ' '),
            url: src
          })
        }
      }
    })

    if (!streamingUrl) {
      const scripts = $("script")
        .map((i, el) => $(el).html())
        .get()
      for (const script of scripts) {
        if (script && script.includes("iframe")) {
          const match = script.match(/src=["']([^"']+)["']/)
          if (match) {
            streamingUrl = match[1]
            if (!videoServers.some(s => s.url === streamingUrl)) {
              videoServers.push({
                name: "Default Player",
                url: streamingUrl
              })
            }
            break
          }
        }
      }
    }

    if (!streamingUrl) {
      streamingUrl = $(".player-embed iframe, .video-content iframe, #pembed iframe").attr("src")
    }

    if (streamingUrl && videoServers.length === 0) {
      videoServers.push({
        name: "Default Server",
        url: streamingUrl
      })
    }

    const episodeTitle = $(".entry-title").text().trim() || $("h1").first().text().trim()

    res.json({
      success: true,
      data: {
        title: episodeTitle,
        slug: slug,
        streaming_url: streamingUrl || "",
        video_servers: videoServers,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get("/api/donghua/search", async (req, res) => {
  try {
    const { q } = req.query
    if (!q) {
      return res.json({ success: true, data: [] })
    }

    const url = `${DONGHUA_BASE_URL}/?s=${encodeURIComponent(q)}`
    console.log("Searching donghua:", url)
    const $ = await fetchPage(url)
    const donghuas = []

    $(".bsx, .listupd .bs, .film_list .item").each((i, elem) => {
      let title = $(elem).find(".tt, .title, h2 a, h3 a").text().trim() || $(elem).find("a").attr("title") || $(elem).find("a").attr("data-title")
      const link = $(elem).find("a").attr("href")
      const image = $(elem).find("img").attr("src") || $(elem).find("img").attr("data-src") || $(elem).find("img").attr("data-lazy-src")

      if (title) {
        title = title.split("\t")[0].split("\n")[0].trim()
      }

      if (title && link) {
        const slug = extractSlug(link)
        if (slug) {
          donghuas.push({
            id: slug,
            name: title,
            slug: slug,
            image_url: image || "https://via.placeholder.com/300x400?text=No+Image",
            url: link,
          })
        }
      }
    })

    console.log(`Found ${donghuas.length} donghua results for query: ${q}`)
    res.json({ success: true, data: donghuas })
  } catch (error) {
    console.error("Donghua search error:", error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

const KOMIK_BASE_URL = "https://komiku.org"

app.get("/api/komik/list", async (req, res) => {
  try {
    const { type = "manga" } = req.query
    const url = `https://api.komiku.org/manga/?tipe=${type}`
    const $ = await fetchPage(url)
    const komikList = []

    $(".bge").each((i, elem) => {
      const link = $(elem).find(".kan a").attr("href")
      const slug = link ? link.split("/manga/")[1].replace("/", "") : ""
      const latestChapterText = $(elem).find(".new1 a").last().text().trim()
      const chapterMatch = latestChapterText.match(/Chapter\s+(.+)/)

      komikList.push({
        title: $(elem).find(".kan h3").text().trim(),
        slug: slug,
        type: $(elem).find(".tpe1_inf b").first().text().trim(),
        thumbnail: $(elem).find(".bgei img").attr("src"),
        synopsis: $(elem).find(".kan p").text().trim(),
        readers: $(elem).find(".judul2 b").text().trim(),
        latestChapter: chapterMatch ? chapterMatch[1] : "",
        url: link,
      })
    })

    res.json({ success: true, type: type, data: komikList })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get("/api/komik/:slug", async (req, res) => {
  try {
    const { slug } = req.params
    const url = `${KOMIK_BASE_URL}/manga/${slug}/`
    const $ = await fetchPage(url)

    const genres = []
    $(".genre li a").each((i, el) => {
      genres.push($(el).text().trim())
    })

    const info = {}
    $(".inftable tr").each((i, el) => {
      const key = $(el).find("td").first().text().trim()
      const value = $(el).find("td").last().text().trim()
      info[key] = value
    })

    const chapters = []
    $("#daftarChapter tr, #Daftar_Chapter tr").each((i, el) => {
      const link = $(el).find("td.judulseries a").attr("href")
      if (!link) return

      const chapterSlug = link ? link.replace(/^\//, "").split("/")[0] : ""

      chapters.push({
        chapter: $(el).find("td.judulseries a span").text().trim() || $(el).find("td.judulseries a").text().trim(),
        title: $(el).find("td.judulseries a").attr("title") || "",
        releaseDate: $(el).find("td.tanggalseries").text().trim(),
        slug: chapterSlug,
        url: link,
      })
    })

    res.json({
      success: true,
      data: {
        title: $(".perapih h1").text().trim(),
        alternativeTitle: info["Judul Indonesia"] || "",
        thumbnail: $(".ims img").attr("data-src") || $(".ims img").attr("src"),
        type: info["Jenis Komik"] || "",
        author: info["Pengarang"] || "",
        status: info["Status"] || "",
        synopsis: $(".sinops p").text().trim(),
        genres: genres,
        chapters: chapters,
        totalChapters: chapters.length,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get("/api/komik/chapter/:chapterSlug", async (req, res) => {
  try {
    const { chapterSlug } = req.params
    const url = `${KOMIK_BASE_URL}/${chapterSlug}/`
    const $ = await fetchPage(url)

    const images = []
    $("#Baca_Komik img").each((i, el) => {
      const imgSrc = $(el).attr("data-src") || $(el).attr("src")
      if (imgSrc) images.push(imgSrc)
    })

    const prevChapter = $("a.prev").attr("href") || $('.nvs.nvsc a[rel="prev"]').attr("href")
    const nextChapter = $("a.next").attr("href") || $('.nvs.nvsc a[rel="next"]').attr("href")

    const prevSlug = prevChapter ? prevChapter.replace(/^\//, "").split("/")[0] : null
    const nextSlug = nextChapter ? nextChapter.replace(/^\//, "").split("/")[0] : null

    res.json({
      success: true,
      data: {
        chapterTitle: $("h1.judul").text().trim(),
        mangaTitle: $(".rig h2 a").text().trim(),
        images: images,
        totalPages: images.length,
        navigation: {
          prevChapter: prevSlug,
          nextChapter: nextSlug,
        },
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get("/api/komik/search", async (req, res) => {
  try {
    const { q } = req.query
    if (!q) return res.json({ success: true, data: [] })

    const url = `${KOMIK_BASE_URL}/?post_type=manga&s=${encodeURIComponent(q)}`
    console.log("Searching komik:", url)
    const $ = await fetchPage(url)
    const results = []

    $(".daftar .bge, .list-update .bs, .bsx, .film_list .item").each((i, elem) => {
      const link = $(elem).find(".kan a, a, h2 a, h3 a").attr("href")
      let slug = ""
      
      if (link) {
        if (link.includes("/manga/")) {
          slug = link.split("/manga/")[1]?.replace("/", "")
        } else {
          slug = extractSlug(link)
        }
      }

      const title = $(elem).find(".kan a, .kan h3, h2 a, h3 a, .title").text().trim()
      const type = $(elem).find(".tpe1_inf b, .type").first().text().trim()
      const thumbnail = $(elem).find(".bgei img, img").attr("data-src") || 
                       $(elem).find(".bgei img, img").attr("src") || 
                       $(elem).find(".bgei img, img").attr("data-lazy-src")

      if (title && slug) {
        results.push({
          title: title,
          slug: slug,
          type: type || "Manga",
          thumbnail: thumbnail || "https://via.placeholder.com/300x400?text=No+Image",
          url: link,
        })
      }
    })

    console.log(`Found ${results.length} komik results for query: ${q}`)
    res.json({ success: true, data: results })
  } catch (error) {
    console.error("Komik search error:", error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"))
})

const PORT = process.env.PORT || 5000
const HOST = '0.0.0.0'

if (require.main === module) {
  app.listen(PORT, HOST, () => {
    console.log(`🚀 Server berjalan di http://${HOST}:${PORT}`)
    console.log(`📺 Akses website di browser untuk mulai streaming anime!`)
  })
}

module.exports = app
