const API_BASE = "https://script.google.com/macros/s/AKfycbwm7_YDeDbPUut-Fb4lQW_MU861dtqd46r54sPoelOFRDYcqkIcnLj8_pP_mqyoDJxx/exec";
let offset = 0;
const limit = 20;
let currentSort = "relevance";
let currentTag = "";
let loading = false;

// DOM Elements
const sortSelect = document.getElementById("sort");
const tagInput = document.getElementById("tag");
const applyFiltersBtn = document.getElementById("apply-filters");
const loadMoreBtn = document.getElementById("loadmore");
const gallery = document.getElementById("gallery");
const loadingSpinner = document.getElementById("loading");
const smallLoadingSpinner = document.getElementById("small-loading");

function parseDuration(duration) {
  if (!duration) return 0;
  const parts = duration.split(":").map(Number);
  if (parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2];
  if (parts.length === 2) return parts[0]*60 + parts[1];
  return parts[0];
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function fetchVideos(reset=false) {
  if (loading) return; 
  loading = true;

  loadingSpinner.style.display = "block";
  loadMoreBtn.style.display = "none";
  smallLoadingSpinner.style.display = "inline-block";

  const url = `${API_BASE}?limit=1000&offset=0&sort=${currentSort}&q=${encodeURIComponent(currentTag)}`;
  const res = await fetch(url);
  const data = await res.json();

  let videos = data.videos || [];

  // Apply frontend duration filters (with randomization + top-up)
  let filtered = [];
  if (currentSort === "short") {
    filtered = videos.filter(v => parseDuration(v.duration) < 600);
  } else if (currentSort === "long") {
    filtered = videos.filter(v => {
      const s = parseDuration(v.duration);
      return s >= 600 && s <= 2400;
    });
  } else if (currentSort === "longest") {
    filtered = videos.filter(v => parseDuration(v.duration) > 2400);
  } else {
    filtered = [...videos];
  }

  filtered = shuffleArray(filtered);

  // Ensure at least `limit` videos
  if (filtered.length < limit) {
    let filler = videos.filter(v => !filtered.includes(v));
    filler = shuffleArray(filler).slice(0, limit - filtered.length);
    filtered = [...filtered, ...filler];
  }

  const batch = filtered.slice(offset, offset + limit);

  if (reset) {
    gallery.innerHTML = "";
    offset = 0;
  }

  batch.forEach(v => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <a href="video.html?id=${v.id}">
        <img class="thumb" src="${v.thumbnail}" alt="${v.title}">
      </a>
      <div class="title">${v.title}</div>
      <div class="meta">${v.duration} • ${v.views} views</div>
    `;
    gallery.appendChild(card);
  });

  loadingSpinner.style.display = "none";
  smallLoadingSpinner.style.display = "none";

  if (offset + limit >= filtered.length) {
    loadMoreBtn.style.display = "none";
  } else {
    loadMoreBtn.style.display = "block";
  }

  offset += limit;
  loading = false;
}

function applyFilters() {
  currentSort = sortSelect.value;
  currentTag = tagInput.value.trim();
  offset = 0;
  fetchVideos(true);
}

function loadMore() {
  fetchVideos();
}

// Event Listeners
applyFiltersBtn.addEventListener("click", applyFilters);
loadMoreBtn.addEventListener("click", loadMore);
sortSelect.addEventListener("change", applyFilters);

// Initialize the gallery
fetchVideos(true);