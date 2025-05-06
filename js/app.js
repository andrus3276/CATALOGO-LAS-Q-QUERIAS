// app.js - Lógica del carrito

const productList = document.getElementById("product-list");
const categoryMenu = document.getElementById("category-menu");
const cartBtn = document.getElementById("cart-btn");
const cartCount = document.getElementById("cart-count");
const cartItems = document.getElementById("cart-items");
const sendOrder = document.getElementById("send-order");
const modalImage = document.getElementById("modal-image");

// Variables globales
let cart = JSON.parse(localStorage.getItem("cart")) || [];
console.log("Inicialización del carrito:", cart);

let allProducts = []; // Variable global para almacenar todos los productos
console.log("Inicialización de allProducts:", allProducts);

// Cargar categorías dinámicamente
async function loadCategories() {
    try {
        const response = await fetch("productos/todos.json");
        const products = await response.json();
        console.log("Productos cargados para categorías:", products);

        const categories = [...new Set(products.map(product => product.category))].sort();
        console.log("Categorías detectadas:", categories);

        let categoryHtml = `<li><a class="dropdown-item" href="#" onclick="filterProducts('todos')">Todos los Productos</a></li>`;
        categories.forEach(category => {
            categoryHtml += `<li><a class="dropdown-item" href="#" onclick="filterProducts('${category}')">${capitalize(category)}</a></li>`;
        });
        document.getElementById("category-menu").innerHTML = categoryHtml;

        loadSpecialDates();
    } catch (error) {
        console.error("Error cargando categorías:", error);
    }
}

// Cargar subcategorías de Fechas Especiales
async function loadSpecialDates() {
    try {
        const response = await fetch("productos/fechas-especiales.json"); // Carga las subcategorías de fechas especiales
        const specialDates = await response.json();

        // Agregar subcategorías al menú de Fechas Especiales
        let specialDatesHtml = "";
        specialDates.forEach(date => {
            specialDatesHtml += `<li><a class="dropdown-item" href="#" onclick="filterProducts('${date.id}')">${date.name}</a></li>`;
        });
        document.getElementById("special-dates-menu").innerHTML = specialDatesHtml;
    } catch (error) {
        console.error("Error cargando fechas especiales:", error);
    }
}

// Capitalizar la primera letra de una palabra
function capitalize(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
}

// Filtrar productos por categoría o subcategoría
function filterProducts(category) {
    console.log("Filtrando productos por categoría:", category);
    const categoryTitle = document.getElementById("category-title");
    categoryTitle.textContent = category === "todos" ? "Todos los Productos" : capitalize(category.replace("-", " "));

    // Cargar productos filtrados
    loadProducts(category);
}

// Cargar productos desde JSON
async function loadProducts(category = "todos") {
    try {
        const fileName = category === "todos" ? "todos.json" : `${category}.json`;
        console.log(`Cargando productos desde: productos/${fileName}`);

        const response = await fetch(`productos/${fileName}`);
        if (!response.ok) {
            throw new Error(`Error al cargar el archivo: productos/${fileName}`);
        }
        const products = await response.json();
        console.log("Productos cargados:", products);

        if (category === "todos") {
            allProducts = products;
            console.log("allProducts actualizado:", allProducts);
        }

        products.forEach(product => {
            if (product.stock === undefined) {
                product.stock = 1;
            }
        });

        const productCountElement = document.getElementById("product-count");
        productCountElement.textContent = `Total de productos: ${products.length}`;
        console.log("Número total de productos:", products.length);

        renderProducts(products);
    } catch (error) {
        console.error("Error cargando productos:", error);
        const productList = document.getElementById("product-list");
        productList.innerHTML = "<p class='text-center text-danger'>Error al cargar los productos. Verifica la consola para más detalles.</p>";
    }
}

// Renderizar productos en la pantalla
function renderProducts(products) {
    console.log("Renderizando productos:", products);

    const productList = document.getElementById("product-list");
    let html = "";

    products.forEach(product => {
        const thumbnails = product.images && product.images.length > 1
            ? `
                <div class="thumbnails mt-2">
                    ${product.images.map(image => `
                        <img src="${image.trim()}" class="thumbnail-img" alt="${product.name}" loading="lazy" onclick="openImageModal('${image.trim()}')">
                    `).join("")}
                </div>
            `
            : "";

        const stockMessage = product.stock === 0
            ? `<span class="badge bg-danger">Agotado</span>`
            : product.stock > 1
            ? `<span class="badge bg-success">En stock: ${product.stock}</span>`
            : "";

        const addToCartButton = product.stock === 0
            ? `<button class="btn btn-secondary" disabled>Agotado</button>`
            : `<button class="btn btn-success" onclick="addToCart(${product.id}, '${product.name}', ${product.price})">Agregar al carrito</button>`;

        html += `
            <div class="col-md-3 mb-4">
                <div class="card shadow-lg">
                    <img src="${product.image.trim()}" class="card-img-top" alt="${product.name}" loading="lazy" onclick="openImageModal('${product.image.trim()}')">
                    ${thumbnails}
                    <div class="card-body text-center">
                        <h5 class="card-title product-name">${product.name}</h5>
                        <p class="card-text">${product.description}</p>
                        <p class="card-text fw-bold">Categoría: ${product.category}</p>
                        <p class="card-text fw-bold">$${product.price.toLocaleString()}</p>
                        ${stockMessage}
                        ${addToCartButton}
                    </div>
                </div>
            </div>
        `;
    });

    productList.innerHTML = html;
}

// Función para abrir el modal con la imagen ampliada
function openImageModal(imageUrl) {
    modalImage.src = imageUrl; // Actualizamos la imagen del modal
    const modal = new bootstrap.Modal(document.getElementById("imageModal"));
    modal.show(); // Mostramos el modal
}

// Agregar al carrito
function addToCart(id, name, price) {
    console.log("Intentando agregar al carrito:", { id, name, price });

    const existingItem = cart.find(item => item.id === id);
    if (existingItem) {
        Swal.fire({
            title: 'Producto duplicado',
            text: 'Este producto ya está en el carrito. ¿Deseas agregarlo nuevamente?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, agregar',
            cancelButtonText: 'No'
        }).then((result) => {
            if (result.isConfirmed) {
                cart.push({ id, name, price });
                saveCart();
                updateCart();
                console.log("Producto agregado nuevamente al carrito:", { id, name, price });
            }
        });
        return;
    }
    cart.push({ id, name, price });
    saveCart();
    updateCart();
    console.log("Producto agregado al carrito:", { id, name, price });
}

// Guardar carrito en localStorage
function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
    console.log("Carrito guardado en localStorage:", cart);
}

// Actualizar carrito
function updateCart() {
    console.log("Actualizando carrito:", cart);

    cartCount.textContent = cart.length;
    cartItems.innerHTML = cart.length === 0
        ? "<p class='text-muted'>Tu carrito está vacío. Agrega productos para comenzar.</p>"
        : cart.map((item, index) => `
            <p>${item.name} - $${item.price.toLocaleString()} 
                <button class="btn btn-sm btn-danger" onclick="removeFromCart(${index})">Eliminar</button>
            </p>`).join(" ");
}

// Eliminar producto del carrito
function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    updateCart();
}

// Enviar pedido por WhatsApp
document.getElementById('send-order').addEventListener('click', function () {
    sendToWhatsApp(); // Llama directamente a la función para enviar el pedido
});

// Función para enviar el pedido por WhatsApp
function sendToWhatsApp() {
    console.log("Enviando pedido por WhatsApp. Contenido del carrito:", cart);

    if (cart.length === 0) {
        Swal.fire({
            title: 'Carrito vacío',
            text: 'Tu carrito está vacío. Por favor, agrega productos antes de enviar el pedido.',
            icon: 'warning',
            confirmButtonText: 'Aceptar'
        });
        return;
    }

    const message = cart.map(item => `${item.name} - $${item.price.toLocaleString()}`).join("\n");
    const total = cart.reduce((acc, item) => acc + item.price, 0);
    console.log("Mensaje generado para WhatsApp:", message);
    console.log("Total del pedido:", total);

    const phone = "573144918810";
    const url = `https://wa.me/${phone}?text=¡Hola! Quiero hacer un pedido:%0A${message}%0A%0ATotal: $${total.toLocaleString()}`;
    const newWindow = window.open(url, "_blank");
    if (!newWindow || newWindow.closed || typeof newWindow.closed === "undefined") {
       //lert("No se pudo abrir WhatsApp. Por favor, revisa tu configuración del navegador.");
    }
}

// Event listeners
cartBtn.addEventListener("click", () => {
    console.log("Abriendo carrito...", cart);
    new bootstrap.Modal(document.getElementById("cartModal")).show();
});
sendOrder.addEventListener("click", sendToWhatsApp);

// Función de búsqueda
let searchIndex = 0; // Índice para rastrear la posición en los resultados de búsqueda
let lastSearchTerm = ""; // Último término de búsqueda

document.getElementById('search-btn').addEventListener('click', function () {
    const searchTerm = document.getElementById('search-input').value.toLowerCase().trim(); // Normaliza el término de búsqueda

    if (searchTerm === "") {
        renderProducts(allProducts); // Si el campo de búsqueda está vacío, muestra todos los productos
        searchIndex = 0; // Reinicia el índice
        lastSearchTerm = ""; // Limpia el último término de búsqueda
        return;
    }

    // Si el término de búsqueda es el mismo que el anterior, avanza al siguiente resultado
    if (searchTerm === lastSearchTerm) {
        searchIndex++;
    } else {
        searchIndex = 0; // Reinicia el índice si el término de búsqueda cambia
        lastSearchTerm = searchTerm; // Actualiza el último término de búsqueda
    }

    // Filtrar productos que coincidan con el término de búsqueda en todas las categorías
    const filteredProducts = allProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm) // Busca coincidencias en el nombre del producto
    );

    if (filteredProducts.length > 0) {
        // Si el índice supera el número de resultados, reinícialo
        if (searchIndex >= filteredProducts.length) {
            searchIndex = 0;
        }

        // Renderiza solo el producto actual basado en el índice
        renderProducts([filteredProducts[searchIndex]]);
    } else {
        Swal.fire({
            title: 'Producto no encontrado',
            text: 'Por favor, intenta con otro término de búsqueda.',
            icon: 'warning',
            confirmButtonText: 'Aceptar'
        });
        renderProducts(allProducts); // Muestra todos los productos si no se encuentra ninguno
        searchIndex = 0; // Reinicia el índice
        lastSearchTerm = ""; // Limpia el último término de búsqueda
    }
});

// Inicializar la página
loadProducts();
loadCategories();
updateCart();

