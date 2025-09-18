const shortcutAddButton = document.querySelector("#shortcut-add");
const modal = document.querySelector(".modal");
const cancelButton = document.querySelector("#cancel-button");
const addButton = document.querySelector("#add-button");
const shortcutGrid = document.querySelector(".shortcut-grid");
const alertBox = document.querySelector("#alert-box");

const nameInput = document.querySelector("#shortcut-name-input");
const urlInput = document.querySelector("#shortcut-url-input");

const searchInput = document.querySelector("#search-bar");

const saveButton = document.querySelector("#save-button");
const deleteButton = document.querySelector("#delete-button");

shortcutAddButton.addEventListener("click", () => {
    modal.style.display = "grid";
});

cancelButton.addEventListener("click", () => {
    modal.style.display = "none";
    nameInput.value = "";
    urlInput.value = "";
});

addButton.addEventListener("click", async () => {
    const name = nameInput.value.trim();
    let url = urlInput.value.trim();
    if (!name || !url) {
        return alertBox.style.display = "block"
    } 

    if (!/:\/\//i.test(url)) {
        url = "https://" + url;
    }
    
    const shortcutHTML = `
    <a class="shortcut-item" href="${url}" target="_blank">
        <img src="${await getFavicon(url)}" alt="${name}">
        <p class="shortcut-name">${name}</p>
    </a>
`;

    shortcutAddButton.insertAdjacentHTML("beforebegin", shortcutHTML);

    nameInput.value = "";
    urlInput.value = "";
    closeModal();
});

nameInput.addEventListener("input", () => {
    alertBox.style.display = "none";
});

urlInput.addEventListener("input", () => {
    alertBox.style.display = "none";
});

searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    const shortcuts = document.querySelectorAll(".shortcut-item");

    shortcuts.forEach(shortcut => {
        const name = shortcut.querySelector(".shortcut-name").textContent.toLowerCase();
        if (name.includes(query)) {
            shortcut.style.display = "flex";
        } else {
            shortcut.style.display = "none";
        }
    });
});

function getFavicon(url) {
    const favicon = `https://www.google.com/s2/favicons?domain=${url}&sz=64`;
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            if (img.naturalWidth === 16 && img.naturalHeight === 16) {
                resolve('assets/earth.svg');
            } else {
                resolve(favicon);
            }
        };
        img.onerror = () => resolve('assets/earth.svg');
        img.src = favicon;
    });
}

shortcutGrid.addEventListener("contextmenu", (e) => {
    const shortcut = e.target.closest(".shortcut-item");
    if (!shortcut) {
        return
    }
    e.preventDefault();

    const currentName = shortcut.querySelector(".shortcut-name").textContent;
    const currentUrl = shortcut.href;

    modal.style.display = "flex";
    document.getElementById("shortcut-name-input").value = currentName;
    document.getElementById("shortcut-url-input").value = currentUrl;

    modal.querySelector("h2").textContent = "Edit Shortcut";
    addButton.style.display = "none";
    cancelButton.style.display = "none";
    saveButton.style.display = "inline-block";
    deleteButton.style.display = "inline-block";

    saveButton.onclick = async() => {
        const newName = nameInput.value.trim();
        let newUrl = urlInput.value.trim();
        if (!newName || !newUrl) {
            return alertBox.style.display = "block"
        }
        if (!/:\/\//i.test(newUrl)) {
            newUrl = "https://" + newUrl;
        }
        shortcut.querySelector(".shortcut-name").textContent = newName;
        shortcut.href = newUrl;
        shortcut.querySelector("img").src = await getFavicon(newUrl);
        shortcut.querySelector("img").alt = newName;
        closeModal();
    };

    deleteButton.onclick = () => {
        shortcut.remove();
        closeModal();
    };
});

function closeModal() {
    saveShortcuts();
    modal.style.display = "none";
    alertBox.style.display = "none";
    nameInput.value = "";
    urlInput.value = "";
    modal.querySelector("h2").textContent = "Create New Shortcut";
    addButton.style.display = "inline-block";
    cancelButton.style.display = "inline-block";
    saveButton.style.display = "none";
    deleteButton.style.display = "none";
    saveButton.onclick = null;
    deleteButton.onclick = null;
}

document.querySelector(".reset").addEventListener("click", () => {
    if (confirm("Are you sure you want to clear all data?")) {
        chrome.storage.local.clear();
        document.querySelectorAll(".shortcut-item").forEach(el => el.remove());
        loadShortcuts();
    }
});

function saveShortcuts() {
    const shortcuts = [];
    document.querySelectorAll(".shortcut-item").forEach(shortcut => {
        const name = shortcut.querySelector(".shortcut-name").textContent;
        const url = shortcut.href;
        shortcuts.push({ name, url });
    });

    chrome.storage.local.set({ dockShortcuts: shortcuts });
}


async function loadShortcuts() {
    chrome.storage.local.get("dockShortcuts", async (result) => {
        let shortcuts = result.dockShortcuts;

        if (shortcuts === undefined) {
            shortcuts = [{ name: "Google", url: "https://www.google.com" }];
            chrome.storage.local.set({ dockShortcuts: shortcuts });
        }

        document.querySelectorAll(".shortcut-item").forEach(el => el.remove());

        const shortcutAddButton = document.querySelector("#shortcut-add");

        if (shortcuts) {
            for (const shortcut of shortcuts) {
                const shortcutHTML = `
                    <a class="shortcut-item" href="${shortcut.url}" target="_blank">
                        <img src="${await getFavicon(shortcut.url)}" alt="${shortcut.name}">
                        <p class="shortcut-name">${shortcut.name}</p>
                    </a>
                `;
                shortcutAddButton.insertAdjacentHTML("beforebegin", shortcutHTML);
            }
        }
    });
}


window.addEventListener("DOMContentLoaded", loadShortcuts);