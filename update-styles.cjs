
const fs = require("fs");

let css = fs.readFileSync("src/styles.css", "utf-8");

const newCSS = `

/* Checkout Page Styles */
.checkout-section {
  padding-top: clamp(100px, 15vw, 150px);
}

.checkout-container {
  max-width: 1200px;
  margin: 0 auto;
}

.back-btn {
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  margin-bottom: 32px;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.back-btn:hover {
  opacity: 1;
}

.checkout-grid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 48px;
}

@media (max-width: 900px) {
  .checkout-grid {
    grid-template-columns: 1fr;
  }
}

.checkout-details h3 {
  font-size: 1.25rem;
  margin-bottom: 16px;
  margin-top: 32px;
  font-weight: 500;
}

.checkout-details h3:first-child {
  margin-top: 0;
}

.summary-card, .guest-info-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 24px;
  border-radius: 8px;
}

.summary-card h4 {
  font-size: 1.5rem;
  margin-bottom: 4px;
}

.summary-card p {
  opacity: 0.7;
  font-size: 0.95rem;
  margin-bottom: 24px;
}

.dates-row {
  display: flex;
  align-items: flex-start;
  gap: 24px;
}

.dates-row div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dates-row strong {
  font-size: 1.1rem;
  font-weight: 500;
}

.meal-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.meal-option {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.meal-option.selected {
  border-color: var(--color-primary);
  background: rgba(182, 194, 158, 0.05);
}

.meal-option input {
  margin: 0;
  accent-color: var(--color-primary);
  width: 18px;
  height: 18px;
}

.meal-option div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meal-option strong {
  font-weight: 500;
  font-size: 1.05rem;
}

.meal-option span {
  font-size: 0.85rem;
  opacity: 0.7;
}

.guest-info-card p {
  margin: 0 0 8px 0;
}
.guest-info-card p:last-child {
  margin: 0;
}

.checkout-sidebar {
  background: var(--color-dark);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 32px;
  border-radius: 8px;
  height: fit-content;
  position: sticky;
  top: 100px;
}

.checkout-sidebar h3 {
  font-size: 1.25rem;
  margin-bottom: 24px;
  font-weight: 500;
}

.price-breakdown {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.price-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.95rem;
}

.price-row.taxes {
  color: var(--color-primary);
  font-size: 0.9rem;
}

.price-row.total {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 1.25rem;
}

.checkout-pay-btn {
  width: 100%;
  margin-top: 32px;
  padding: 16px;
  font-size: 1.1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
`;

css += newCSS;
fs.writeFileSync("src/styles.css", css, "utf-8");
console.log("Styles appended.");
