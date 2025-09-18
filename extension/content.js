(async function() {
    const containerParent = document.querySelector("body > div.L3eUgb > div.o3j99.qarstb");
    if (!containerParent) return;

    const container = document.createElement('div');
    container.id = 'dock-container';
    containerParent.appendChild(container);

    const dockHTML = `
        <input type="text" id="search-bar" placeholder="Search...">
        <div class="shortcut-grid">
            <button id="shortcut-add">
                <svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512"><path d="M448 256c0-106-86-192-192-192S64 150 64 256s86 192 192 192 192-86 192-192z" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="32"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M256 176v160M336 256H176"/></svg>
            </button>
        </div>
        <div class="modal">
            <div class="modal-content">
                <h2>Create New Shortcut</h2>
                <input type="text" id="shortcut-name-input" placeholder="Shortcut Name">
                <input type="url" id="shortcut-url-input" placeholder="Shortcut URL">
                <div class="modal-buttons">
                    <p id="alert-box">Please enter both name and URL</p>
                    <button id="add-button">Add</button>
                    <button id="cancel-button">Cancel</button>
                    <button id="save-button">Save</button>
                    <button id="delete-button">Delete</button>
                </div>
            </div>
        </div>
        <button class="reset">Clear Dock Data</button>
    `;
    container.innerHTML = dockHTML;

    const shortcutAddButton = container.querySelector("#shortcut-add");
    const modal = container.querySelector(".modal");
    const cancelButton = container.querySelector("#cancel-button");
    const addButton = container.querySelector("#add-button");
    const shortcutGrid = container.querySelector(".shortcut-grid");
    const alertBox = container.querySelector("#alert-box");
    const nameInput = container.querySelector("#shortcut-name-input");
    const urlInput = container.querySelector("#shortcut-url-input");
    const searchInput = container.querySelector("#search-bar");
    const saveButton = container.querySelector("#save-button");
    const deleteButton = container.querySelector("#delete-button");

    function getFavicon(url) {
        const favicon = `https://www.google.com/s2/favicons?domain=${url}&sz=64`;
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                if (img.naturalWidth === 16 && img.naturalHeight === 16) {
                    resolve(chrome.runtime.getURL('assets/earth.svg'));
                } else {
                    resolve(favicon);
                }
            };
            img.onerror = () => resolve(chrome.runtime.getURL('assets/earth.svg'));
            img.src = favicon;
        });
    }

    async function addShortcut(name, url) {
        const imgSrc = await getFavicon(url);
        const shortcutHTML = `
            <a class="shortcut-item" href="${url}" target="_blank">
                <img src="${imgSrc}" alt="${name}">
                <p class="shortcut-name">${name}</p>
            </a>
        `;
        shortcutAddButton.insertAdjacentHTML("beforebegin", shortcutHTML);
    }

    function saveShortcuts() {
        const shortcuts = [];
        container.querySelectorAll(".shortcut-item").forEach(shortcut => {
            shortcuts.push({
                name: shortcut.querySelector(".shortcut-name").textContent,
                url: shortcut.href
            });
        });
        chrome.storage.local.set({dockShortcuts: shortcuts});
    }

    async function loadShortcuts() {
        const data = await chrome.storage.local.get('dockShortcuts');
        const shortcuts = data.dockShortcuts || [{name: 'Google', url: 'https://www.google.com'}];
        for (const shortcut of shortcuts) await addShortcut(shortcut.name, shortcut.url);
    }

    shortcutAddButton.addEventListener("click", () => modal.style.display = "grid");
    cancelButton.addEventListener("click", () => {
        modal.style.display = "none";
        nameInput.value = "";
        urlInput.value = "";
    });

    addButton.addEventListener("click", async () => {
        const name = nameInput.value.trim();
        let url = urlInput.value.trim();
        if (!name || !url) return alertBox.style.display = "block";
        if (!/:\/\//i.test(url)) url = "https://" + url;
        await addShortcut(name, url);
        saveShortcuts();
        nameInput.value = "";
        urlInput.value = "";
        modal.style.display = "none";
        alertBox.style.display = "none";
    });

    searchInput.addEventListener("input", () => {
        const query = searchInput.value.toLowerCase();
        container.querySelectorAll(".shortcut-item").forEach(item => {
            const name = item.querySelector(".shortcut-name").textContent.toLowerCase();
            item.style.display = name.includes(query) ? "flex" : "none";
        });
    });

    shortcutGrid.addEventListener("contextmenu", (e) => {
        const shortcut = e.target.closest(".shortcut-item");
        if (!shortcut) return;
        e.preventDefault();

        const currentName = shortcut.querySelector(".shortcut-name").textContent;
        const currentUrl = shortcut.href;

        modal.style.display = "flex";
        nameInput.value = currentName;
        urlInput.value = currentUrl;
        modal.querySelector("h2").textContent = "Edit Shortcut";
        addButton.style.display = "none";
        cancelButton.style.display = "none";
        saveButton.style.display = "inline-block";
        deleteButton.style.display = "inline-block";

        saveButton.onclick = async() => {
            const newName = nameInput.value.trim();
            let newUrl = urlInput.value.trim();
            if (!newName || !newUrl) return alertBox.style.display = "block";
            if (!/:\/\//i.test(newUrl)) newUrl = "https://" + newUrl;
            shortcut.querySelector(".shortcut-name").textContent = newName;
            shortcut.href = newUrl;
            shortcut.querySelector("img").src = await getFavicon(newUrl);
            shortcut.querySelector("img").alt = newName;
            modal.style.display = "none";
            alertBox.style.display = "none";
        };

        deleteButton.onclick = () => {
            shortcut.remove();
            modal.style.display = "none";
            alertBox.style.display = "none";
        };
    });

    container.querySelector(".reset").addEventListener("click", () => {
        if (confirm("Are you sure you want to clear all data?")) {
            chrome.storage.local.clear();
            container.querySelectorAll(".shortcut-item").forEach(el => el.remove());
            loadShortcuts();
        }
    });

    loadShortcuts();
})();
