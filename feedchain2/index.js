(function() {
      const sections = document.querySelectorAll("[data-section]");
      const navLinks = document.querySelectorAll(".nav-link[data-nav]");
      const heroNavButtons = document.querySelectorAll("[data-nav-target]");
      const connectWalletBtn = document.getElementById("connect-wallet");
      const walletIndicator = document.getElementById("wallet-indicator");
      const walletIndicatorText = document.getElementById("wallet-indicator-text");
      const foodListEl = document.getElementById("food-list");
      const ledgerBodyEl = document.getElementById("ledger-body");
      const toastEl = document.getElementById("toast");
      const toastIconEl = document.getElementById("toast-icon");
      const toastTitleEl = document.getElementById("toast-title");
      const toastMessageEl = document.getElementById("toast-message");

      let walletConnected = false;
      let walletAddress = "";
      let toastTimeoutId = null;

      const initialFoodData = [
        {
          id: "fd-1",
          type: "Buffet trays (vegetarian)",
          quantity: "40 portions",
          distance: "0.8 km",
          timeLeft: "2h 10m",
          status: "Available",
          location: "Downtown Conference Hall",
          postedBy: "eventHost.eth"
        },
        {
          id: "fd-2",
          type: "Sandwich platters + fruit",
          quantity: "25 portions",
          distance: "1.3 km",
          timeLeft: "1h 05m",
          status: "Available",
          location: "City Meetup Hub",
          postedBy: "civicMeetup.host"
        },
        {
          id: "fd-3",
          type: "Pastries & coffee",
          quantity: "30 portions",
          distance: "0.4 km",
          timeLeft: "45m",
          status: "Claimed",
          location: "Tech Campus Atrium",
          postedBy: "campusSummit.org",
          claimedBy: "0xB3f4…7c92"
        }
      ];

      const initialLedgerData = [
        {
          foodId: "fd-1",
          time: "2 min ago",
          food: "Buffet trays (40)",
          location: "Downtown Conference Hall",
          postedBy: "eventHost.eth",
          claimedBy: "",
          status: "Available"
        },
        {
          foodId: "fd-2",
          time: "9 min ago",
          food: "Sandwich platters (25)",
          location: "City Meetup Hub",
          postedBy: "civicMeetup.host",
          claimedBy: "",
          status: "Available"
        },
        {
          foodId: "fd-3",
          time: "28 min ago",
          food: "Pastries & coffee (30)",
          location: "Tech Campus Atrium",
          postedBy: "campusSummit.org",
          claimedBy: "0xB3f4…7c92",
          status: "Distributed"
        }
      ];

      function showSection(target) {
        sections.forEach(sec => {
          sec.classList.toggle("section--active", sec.getAttribute("data-section") === target);
        });
        navLinks.forEach(link => {
          link.classList.toggle("nav-link--active", link.getAttribute("data-nav") === target);
        });
        try {
          history.replaceState(null, "", "#" + target);
        } catch (e) {}
      }

      navLinks.forEach(link => {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          const target = link.getAttribute("data-nav");
          showSection(target);
          window.scrollTo({ top: 0, behavior: "smooth" });
        });
      });

      heroNavButtons.forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          const target = btn.getAttribute("data-nav-target");
          showSection(target);
          window.scrollTo({ top: 0, behavior: "smooth" });
        });
      });

      function randomHex(n) {
        const chars = "abcdef0123456789";
        let out = "";
        for (let i = 0; i < n; i++) {
          out += chars[Math.floor(Math.random() * chars.length)];
        }
        return out;
      }

      function generateFakeAddress() {
        return "0x" + randomHex(40);
      }

      function shortAddress(addr) {
        if (!addr || addr.length < 10) return addr || "";
        return addr.slice(0, 6) + "…" + addr.slice(-4);
      }

      function updateWalletUI() {
        if (walletConnected) {
          walletIndicator.classList.add("wallet-indicator--connected");
          walletIndicatorText.textContent = shortAddress(walletAddress);
          connectWalletBtn.textContent = "Disconnect";
        } else {
          walletIndicator.classList.remove("wallet-indicator--connected");
          walletIndicatorText.textContent = "Not connected";
          connectWalletBtn.textContent = "Connect Wallet";
        }
      }

      function showToast(type, title, message) {
        toastEl.classList.remove("toast--error", "toast--info");
        if (type === "error") {
          toastEl.classList.add("toast--error");
          toastIconEl.textContent = "!";
        } else if (type === "info") {
          toastEl.classList.add("toast--info");
          toastIconEl.textContent = "i";
        } else {
          toastIconEl.textContent = "✓";
        }
        toastTitleEl.textContent = title;
        toastMessageEl.textContent = message;
        toastEl.classList.add("toast--visible");
        if (toastTimeoutId) {
          clearTimeout(toastTimeoutId);
        }
        toastTimeoutId = setTimeout(() => {
          toastEl.classList.remove("toast--visible");
        }, 4300);
      }

      connectWalletBtn.addEventListener("click", () => {
        if (!walletConnected) {
          walletConnected = true;
          walletAddress = generateFakeAddress();
          updateWalletUI();
          showToast("success", "Wallet connected", "You can now claim food and sign distribution updates.");
        } else {
          walletConnected = false;
          walletAddress = "";
          updateWalletUI();
          showToast("info", "Wallet disconnected", "You are now browsing in read-only mode.");
        }
      });

      function renderStatusBadge(status) {
        const normalized = (status || "").toLowerCase();
        let cls = "badge";
        if (normalized === "available") cls += " badge--available";
        else if (normalized === "claimed") cls += " badge--claimed";
        else if (normalized === "distributed") cls += " badge--distributed";
        return `<span class="${cls}">
          <span class="badge-dot"></span>
          ${status}
        </span>`;
      }

      function createFoodCard(food) {
        const article = document.createElement("article");
        article.className = "food-card";
        article.setAttribute("data-food-id", food.id);
        article.setAttribute("data-status", food.status);
        if (food.status === "Claimed") article.classList.add("food-card--claimed");
        if (food.status === "Distributed") article.classList.add("food-card--distributed");

        const claimedText = food.status === "Claimed" || food.status === "Distributed" ? "Claimed" : "Claim with Wallet";
        const claimedDisabled = food.status === "Claimed" || food.status === "Distributed";

        article.innerHTML = `
          <div class="food-card-header">
            <div>
              <div class="food-type">${food.type}</div>
              <div class="food-meta">${food.quantity} • ${food.location}</div>
              <div class="food-pill-row">
                <span class="pill pill-soft">${food.distance} away</span>
                <span class="pill pill-warn">${food.timeLeft} left</span>
              </div>
            </div>
            ${renderStatusBadge(food.status)}
          </div>
          <div class="food-card-footer">
            <div class="food-origin">
              <span class="dot"></span>
              <span>Posted by <span class="text-mono">${food.postedBy || "event-host.local"}</span></span>
            </div>
            <button class="btn btn-outline btn-sm claim-btn" data-food-id="${food.id}" ${claimedDisabled ? "disabled" : ""}>
              ${claimedText}
            </button>
          </div>
        `;

        return article;
      }

      function addFoodCard(food) {
        const card = createFoodCard(food);
        foodListEl.appendChild(card);
      }

      function addLedgerRow(entry, appendBottom) {
        const tr = document.createElement("tr");
        tr.setAttribute("data-food-id", entry.foodId);
        tr.innerHTML = `
          <td class="ledger-col-time">${entry.time}</td>
          <td class="ledger-col-food">${entry.food}</td>
          <td class="ledger-col-location">${entry.location}</td>
          <td class="ledger-col-postedBy">
            <span class="text-mono">${entry.postedBy}</span>
          </td>
          <td class="ledger-col-claimedBy">
            ${entry.claimedBy ? `<span class="text-mono">${entry.claimedBy}</span>` : `<span class="muted">—</span>`}
          </td>
          <td class="ledger-col-status">
            ${renderStatusBadge(entry.status)}
          </td>
        `;
        if (appendBottom) {
          ledgerBodyEl.appendChild(tr);
        } else {
          ledgerBodyEl.prepend(tr);
        }
      }

      function handleClaim(foodId) {
        if (!walletConnected) {
          showToast("error", "Wallet required", "Connect a wallet to claim and sign for pickup.");
          return;
        }
        const card = foodListEl.querySelector(`.food-card[data-food-id="${foodId}"]`);
        if (!card) return;
        const status = card.getAttribute("data-status");
        if (status !== "Available") {
          showToast("info", "Already claimed", "This food has already been claimed or distributed.");
          return;
        }

        card.setAttribute("data-status", "Claimed");
        card.classList.remove("food-card--distributed");
        card.classList.add("food-card--claimed");

        const badgeContainer = card.querySelector(".badge");
        if (badgeContainer) {
          badgeContainer.outerHTML = renderStatusBadge("Claimed");
        }

        const btn = card.querySelector(".claim-btn");
        if (btn) {
          btn.textContent = "Claimed";
          btn.disabled = true;
        }

        const row = ledgerBodyEl.querySelector(`tr[data-food-id="${foodId}"]`);
        if (row) {
          const claimedCell = row.querySelector(".ledger-col-claimedBy");
          const statusCell = row.querySelector(".ledger-col-status");
          if (claimedCell) {
            claimedCell.innerHTML = `<span class="text-mono">${shortAddress(walletAddress)}</span>`;
          }
          if (statusCell) {
            statusCell.innerHTML = renderStatusBadge("Claimed");
          }
        } else {
          addLedgerRow({
            foodId,
            time: "Just now",
            food: card.querySelector(".food-type")?.textContent || "Surplus food",
            location: card.querySelector(".food-meta")?.textContent?.split("•").slice(-1)[0]?.trim() || "Unknown",
            postedBy: "event-host.local",
            claimedBy: shortAddress(walletAddress),
            status: "Claimed"
          });
        }

        showToast("success", "Food claimed", "Pickup details are now associated with your wallet and visible on the public ledger.");
      }

      function setUpClaimButtons() {
        foodListEl.querySelectorAll(".claim-btn").forEach(btn => {
          btn.addEventListener("click", () => {
            const foodId = btn.getAttribute("data-food-id");
            handleClaim(foodId);
          });
        });
      }

      function initData() {
        initialFoodData.forEach(addFoodCard);
        initialLedgerData.forEach(entry => addLedgerRow(entry, true));
        setUpClaimButtons();
      }

      const postForm = document.getElementById("post-form");
      if (postForm) {
        postForm.addEventListener("submit", (e) => {
          e.preventDefault();
          const formData = new FormData(postForm);
          const type = (formData.get("food-type") || "").toString().trim();
          const quantity = (formData.get("quantity") || "").toString().trim();
          const location = (formData.get("location") || "").toString().trim();
          const expiry = (formData.get("expiry") || "").toString().trim();

          const id = "fd-" + Date.now();
          const food = {
            id,
            type: type || "Surplus food",
            quantity: quantity || "Unknown",
            distance: "Nearby",
            timeLeft: "Soon",
            status: "Available",
            location: location || "Shared privately",
            postedBy: walletConnected ? shortAddress(walletAddress) : "event-host.local"
          };
          addFoodCard(food);
          setUpClaimButtons();

          const ledgerEntry = {
            foodId: id,
            time: "Just now",
            food: `${food.type} (${food.quantity})`,
            location: food.location,
            postedBy: food.postedBy,
            claimedBy: "",
            status: "Available"
          };
          addLedgerRow(ledgerEntry, false);

          showToast("success", "Food posted", "Your surplus is now visible in the live feed for nearby volunteers and NGOs.");
          postForm.reset();
          showSection("available");
          window.scrollTo({ top: 0, behavior: "smooth" });

          return false;
        });
      }

      function initSectionFromHash() {
        const hash = (location.hash || "").replace("#", "");
        const valid = ["home", "post", "available", "transparency", "about"];
        const target = valid.includes(hash) ? hash : "home";
        showSection(target);
      }

      initData();
      updateWalletUI();
      initSectionFromHash();
    })();