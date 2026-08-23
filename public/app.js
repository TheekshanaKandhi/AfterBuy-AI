// ============================================================
// AFTERBUY AI
// COMPLETE FRONTEND APPLICATION
// ============================================================


// ============================================================
// CONFIGURATION
// ============================================================

const API_BASE =
    window.AFTERBUY_API_URL ||
    "http://localhost:5000/api";


const TOKEN_KEY =
    "afterbuyAuthToken";


const USER_KEY =
    "afterbuyUser";


let purchases = [];


// ============================================================
// AUTH STORAGE
// ============================================================

function getToken() {

    return localStorage.getItem(
        TOKEN_KEY
    );
}


function getCurrentUser() {

    try {

        const value =
            localStorage.getItem(
                USER_KEY
            );

        return value
            ? JSON.parse(value)
            : null;

    } catch {

        return null;
    }
}


function isLoggedIn() {

    return Boolean(
        getToken()
    );
}


function setAuth(
    token,
    user
) {

    if (!token) {

        throw new Error(
            "Authentication token was not received from the server."
        );
    }


    localStorage.setItem(
        TOKEN_KEY,
        token
    );


    localStorage.setItem(
        USER_KEY,
        JSON.stringify(
            user || {}
        )
    );
}


function clearAuth() {

    localStorage.removeItem(
        TOKEN_KEY
    );

    localStorage.removeItem(
        USER_KEY
    );
}


// ============================================================
// AUTH PAGE
// ============================================================

function showRegister() {

    const register =
        document.getElementById(
            "registerPanel"
        );

    const login =
        document.getElementById(
            "loginPanel"
        );


    if (register) {

        register.style.display =
            "block";
    }


    if (login) {

        login.style.display =
            "none";
    }


    clearAuthMessages();
}


function showLogin() {

    const register =
        document.getElementById(
            "registerPanel"
        );

    const login =
        document.getElementById(
            "loginPanel"
        );


    if (register) {

        register.style.display =
            "none";
    }


    if (login) {

        login.style.display =
            "block";
    }


    clearAuthMessages();
}


function showApplication() {

    const auth =
        document.getElementById(
            "authSection"
        );

    const app =
        document.getElementById(
            "appSection"
        );


    if (auth) {

        auth.style.display =
            "none";
    }


    if (app) {

        app.style.display =
            "block";
    }
}


function showAuthentication() {

    const auth =
        document.getElementById(
            "authSection"
        );

    const app =
        document.getElementById(
            "appSection"
        );


    if (auth) {

        auth.style.display =
            "flex";
    }


    if (app) {

        app.style.display =
            "none";
    }


    showRegister();
}


function clearAuthMessages() {

    const register =
        document.getElementById(
            "registerMessage"
        );

    const login =
        document.getElementById(
            "loginMessage"
        );


    if (register) {

        register.textContent =
            "";

        register.className =
            "auth-message";
    }


    if (login) {

        login.textContent =
            "";

        login.className =
            "auth-message";
    }
}


function showAuthMessage(
    id,
    message,
    type = "error"
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return;
    }


    element.textContent =
        message;


    element.className =
        `auth-message ${type}`;
}


// ============================================================
// PASSWORD VISIBILITY
// ============================================================

function togglePassword(
    inputId,
    button
) {

    const input =
        document.getElementById(
            inputId
        );


    if (!input) {

        return;
    }


    if (
        input.type ===
        "password"
    ) {

        input.type =
            "text";

        button.textContent =
            "🙈";

    } else {

        input.type =
            "password";

        button.textContent =
            "👁";
    }
}


// ============================================================
// API
// ============================================================

async function apiRequest(
    endpoint,
    options = {}
) {

    const headers = {

        "Content-Type":
            "application/json",

        ...(options.headers || {})
    };


    const token =
        getToken();


    if (token) {

        headers.Authorization =
            `Bearer ${token}`;
    }


    let response;


    try {

        response =
            await fetch(
                API_BASE + endpoint,
                {
                    ...options,
                    headers
                }
            );

    } catch (error) {

        console.error(
            "API connection error:",
            error
        );


        throw new Error(
            "Unable to connect to AfterBuy AI server. Make sure the backend is running on port 5000."
        );
    }


    let data = {};


    try {

        data =
            await response.json();

    } catch {

        data = {};
    }


    if (
        response.status ===
        401
    ) {

        clearAuth();

        showAuthentication();


        throw new Error(
            data.message ||
            "Your session has expired. Please sign in again."
        );
    }


    if (!response.ok) {

        throw new Error(
            data.message ||
            `Server error (${response.status}).`
        );
    }


    return data;
}


// ============================================================
// REGISTER API
// ============================================================

async function registerUser(
    name,
    email,
    password
) {

    const cleanName =
        String(
            name || ""
        ).trim();


    const cleanEmail =
        String(
            email || ""
        ).trim().toLowerCase();


    if (
        cleanName.length <
        2
    ) {

        throw new Error(
            "Please enter your full name."
        );
    }


    if (
        !cleanEmail
    ) {

        throw new Error(
            "Please enter your email address."
        );
    }


    if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            cleanEmail
        )
    ) {

        throw new Error(
            "Please enter a valid email address."
        );
    }


    if (
        password.length <
        6
    ) {

        throw new Error(
            "Password must contain at least 6 characters."
        );
    }


    const result =
        await apiRequest(
            "/auth/register",
            {

                method:
                    "POST",

                body:
                    JSON.stringify({

                        name:
                            cleanName,

                        email:
                            cleanEmail,

                        password
                    })
            }
        );


    if (
        !result.token
    ) {

        throw new Error(
            "Registration response did not contain a login token."
        );
    }


    setAuth(
        result.token,
        result.user
    );


    return result;
}


// ============================================================
// LOGIN API
// ============================================================

async function loginUser(
    email,
    password
) {

    const cleanEmail =
        String(
            email || ""
        ).trim().toLowerCase();


    if (
        !cleanEmail
    ) {

        throw new Error(
            "Please enter your email address."
        );
    }


    if (
        !password
    ) {

        throw new Error(
            "Please enter your password."
        );
    }


    const result =
        await apiRequest(
            "/auth/login",
            {

                method:
                    "POST",

                body:
                    JSON.stringify({

                        email:
                            cleanEmail,

                        password
                    })
            }
        );


    if (
        !result.token
    ) {

        throw new Error(
            "Login response did not contain an authentication token."
        );
    }


    setAuth(
        result.token,
        result.user
    );


    return result;
}


// ============================================================
// REGISTER FORM
// ============================================================

async function handleRegister(
    event
) {

    event.preventDefault();


    const name =
        document.getElementById(
            "authName"
        ).value;


    const email =
        document.getElementById(
            "registerEmail"
        ).value;


    const password =
        document.getElementById(
            "registerPassword"
        ).value;


    const button =
        document.getElementById(
            "registerButton"
        );


    const buttonText =
        document.getElementById(
            "registerButtonText"
        );


    showAuthMessage(
        "registerMessage",
        "Creating your account...",
        "loading"
    );


    button.disabled =
        true;


    buttonText.textContent =
        "Creating Account...";


    try {

        await registerUser(
            name,
            email,
            password
        );


        showAuthMessage(
            "registerMessage",
            "Account created successfully!",
            "success"
        );


        await loadPurchases();


        showApplication();


        displayPurchases();


    } catch (error) {

        console.error(
            "REGISTER ERROR:",
            error
        );


        showAuthMessage(
            "registerMessage",
            error.message,
            "error"
        );

    } finally {

        button.disabled =
            false;

        buttonText.textContent =
            "Create Account";
    }
}


// ============================================================
// LOGIN FORM
// ============================================================

async function handleLogin(
    event
) {

    event.preventDefault();


    const email =
        document.getElementById(
            "loginEmail"
        ).value;


    const password =
        document.getElementById(
            "loginPassword"
        ).value;


    const button =
        document.getElementById(
            "loginButton"
        );


    const buttonText =
        document.getElementById(
            "loginButtonText"
        );


    showAuthMessage(
        "loginMessage",
        "Signing you in...",
        "loading"
    );


    button.disabled =
        true;


    buttonText.textContent =
        "Signing In...";


    try {

        await loginUser(
            email,
            password
        );


        showAuthMessage(
            "loginMessage",
            "Login successful!",
            "success"
        );


        await loadPurchases();


        showApplication();


        displayPurchases();


    } catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );


        showAuthMessage(
            "loginMessage",
            error.message,
            "error"
        );

    } finally {

        button.disabled =
            false;

        buttonText.textContent =
            "Sign In";
    }
}


// ============================================================
// LOGOUT
// ============================================================

function logoutUser() {

    clearAuth();


    purchases =
        [];


    showAuthentication();


    displayPurchases();
}


// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
            "AfterBuy AI frontend loaded."
        );


        const registerForm =
            document.getElementById(
                "registerForm"
            );


        const loginForm =
            document.getElementById(
                "loginForm"
            );


        if (registerForm) {

            registerForm.addEventListener(
                "submit",
                handleRegister
            );
        }


        if (loginForm) {

            loginForm.addEventListener(
                "submit",
                handleLogin
            );
        }


        setDefaultPurchaseDate();


        if (
            isLoggedIn()
        ) {

            showApplication();


            try {

                await loadPurchases();

            } catch (error) {

                console.error(
                    error
                );
            }

        } else {

            showAuthentication();

            displayPurchases();
        }


        updateNotificationUI();
    }
);


// ============================================================
// PURCHASES
// ============================================================

async function loadPurchases() {

    if (
        !isLoggedIn()
    ) {

        purchases =
            [];

        displayPurchases();

        return;
    }


    try {

        const result =
            await apiRequest(
                "/purchases"
            );


        purchases =
            Array.isArray(
                result.purchases
            )
                ? result.purchases
                : [];


        displayPurchases();

    } catch (error) {

        console.error(
            "Unable to load purchases:",
            error
        );

        throw error;
    }
}


// ============================================================
// PURCHASE FORM
// ============================================================

function showPurchaseForm() {

    if (
        !isLoggedIn()
    ) {

        showAuthentication();

        showLogin();

        showAuthMessage(
            "loginMessage",
            "Please sign in before adding a purchase.",
            "error"
        );

        return;
    }


    const form =
        document.getElementById(
            "purchaseForm"
        );


    if (!form) {

        return;
    }


    form.style.display =
        "block";


    document.getElementById(
        "formTitle"
    ).textContent =
        "Add Purchase";


    document.getElementById(
        "saveButtonText"
    ).textContent =
        "Save Purchase";


    document.getElementById(
        "editingPurchaseId"
    ).value =
        "";


    clearForm();


    setDefaultPurchaseDate();


    window.scrollTo({

        top:
            form.offsetTop - 20,

        behavior:
            "smooth"
    });
}


function hidePurchaseForm() {

    const form =
        document.getElementById(
            "purchaseForm"
        );


    if (form) {

        form.style.display =
            "none";
    }


    clearForm();
}


function clearForm() {

    const ids = [

        "productName",

        "purchasePrice",

        "purchaseDate",

        "returnPeriod",

        "warranty",

        "currentPrice",

        "editingPurchaseId"
    ];


    ids.forEach(
        id => {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                element.value =
                    "";
            }
        }
    );
}


function setDefaultPurchaseDate() {

    const input =
        document.getElementById(
            "purchaseDate"
        );


    if (
        !input ||
        input.value
    ) {

        return;
    }


    input.value =
        formatDateInput(
            new Date()
        );
}


// ============================================================
// SAVE PURCHASE
// ============================================================

async function savePurchase() {

    if (
        !isLoggedIn()
    ) {

        alert(
            "Please sign in first."
        );

        return;
    }


    const productName =
        document.getElementById(
            "productName"
        ).value.trim();


    const purchasePrice =
        Number(
            document.getElementById(
                "purchasePrice"
            ).value
        );


    const purchaseDate =
        document.getElementById(
            "purchaseDate"
        ).value;


    const returnPeriod =
        Number(
            document.getElementById(
                "returnPeriod"
            ).value
        );


    const warranty =
        Number(
            document.getElementById(
                "warranty"
            ).value
        );


    const currentPrice =
        Number(
            document.getElementById(
                "currentPrice"
            ).value
        );


    const editingId =
        document.getElementById(
            "editingPurchaseId"
        ).value;


    if (
        !productName ||
        purchasePrice <= 0 ||
        !purchaseDate ||
        returnPeriod <= 0 ||
        warranty <= 0 ||
        currentPrice <= 0
    ) {

        alert(
            "Please fill all fields correctly."
        );

        return;
    }


    const payload = {

        productName,

        purchasePrice,

        purchaseDate,

        returnPeriod,

        warranty,

        currentPrice
    };


    try {

        if (
            editingId
        ) {

            const result =
                await apiRequest(
                    `/purchases/${editingId}`,
                    {

                        method:
                            "PUT",

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );


            replaceLocalPurchase(
                result.purchase
            );


            alert(
                "Purchase updated successfully."
            );

        } else {

            const result =
                await apiRequest(
                    "/purchases",
                    {

                        method:
                            "POST",

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );


            purchases.push(
                result.purchase
            );


            alert(
                "Purchase added successfully."
            );
        }


        hidePurchaseForm();

        displayPurchases();

    } catch (error) {

        alert(
            error.message
        );
    }
}


function replaceLocalPurchase(
    purchase
) {

    const index =
        purchases.findIndex(
            item =>
                String(
                    item._id
                ) ===
                String(
                    purchase._id
                )
        );


    if (
        index !== -1
    ) {

        purchases[index] =
            purchase;
    }
}


// ============================================================
// HELPERS
// ============================================================

function findPurchase(
    id
) {

    return purchases.find(
        item =>
            String(
                item._id ||
                item.id
            ) ===
            String(id)
    );
}


function getPurchaseDate(
    purchase
) {

    return new Date(
        purchase.purchaseDate +
        "T00:00:00"
    );
}


function getReturnDeadline(
    purchase
) {

    const deadline =
        new Date(
            getPurchaseDate(
                purchase
            )
        );


    deadline.setDate(
        deadline.getDate() +
        Number(
            purchase.returnPeriod
        )
    );


    return deadline;
}


function getWarrantyDeadline(
    purchase
) {

    const deadline =
        new Date(
            getPurchaseDate(
                purchase
            )
        );


    deadline.setMonth(
        deadline.getMonth() +
        Number(
            purchase.warranty
        )
    );


    return deadline;
}


function getDaysRemaining(
    deadline
) {

    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    return Math.ceil(

        (
            deadline.getTime() -
            today.getTime()
        ) /
        (
            1000 *
            60 *
            60 *
            24
        )
    );
}


function formatDate(
    date
) {

    return date.toLocaleDateString(
        "en-IN",
        {

            day:
                "numeric",

            month:
                "short",

            year:
                "numeric"
        }
    );
}


function formatDateInput(
    date
) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;
}


function formatMoney(
    amount
) {

    return Number(
        amount
    ).toLocaleString(
        "en-IN",
        {
            maximumFractionDigits:
                2
        }
    );
}


function getPriceDifference(
    purchase
) {

    return (

        Number(
            purchase.purchasePrice
        ) -

        Number(
            purchase.currentPrice
        )
    );
}


function getSavings(
    purchase
) {

    const difference =
        getPriceDifference(
            purchase
        );


    return difference > 0
        ? difference
        : 0;
}


function escapeHTML(
    text
) {

    return String(
        text
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


// ============================================================
// STATUS
// ============================================================

function getReturnStatus(
    purchase
) {

    const days =
        getDaysRemaining(
            getReturnDeadline(
                purchase
            )
        );


    if (
        days <= 0
    ) {

        return {

            className:
                "status-danger",

            message:
                "🔴 Return period expired."
        };
    }


    if (
        days <= 3
    ) {

        return {

            className:
                "status-danger",

            message:
                `🔴 Return window closing soon! ${days} days remaining.`
        };
    }


    if (
        days <= 7
    ) {

        return {

            className:
                "status-warning",

            message:
                `🟡 Return window approaching. ${days} days remaining.`
        };
    }


    return {

        className:
            "status-good",

        message:
            `🟢 Return period active. ${days} days remaining.`
    };
}


function getWarrantyStatus(
    purchase
) {

    const days =
        getDaysRemaining(
            getWarrantyDeadline(
                purchase
            )
        );


    if (
        days <= 0
    ) {

        return {

            className:
                "status-danger",

            message:
                "🔴 Warranty expired."
        };
    }


    if (
        days <= 30
    ) {

        return {

            className:
                "status-warning",

            message:
                `🟡 Warranty expires in ${days} days.`
        };
    }


    return {

        className:
            "status-good",

        message:
            `🟢 Warranty active. ${days} days remaining.`
    };
}


// ============================================================
// DASHBOARD
// ============================================================

async function updateDashboard() {

    if (
        !isLoggedIn()
    ) {

        return;
    }


    try {

        const result =
            await apiRequest(
                "/dashboard"
            );


        const d =
            result.dashboard;


        if (!d) {

            return;
        }


        setText(
            "totalPurchases",
            d.totalPurchases
        );


        setText(
            "totalSavings",
            "₹" +
            formatMoney(
                d.totalSavings
            )
        );


        setText(
            "returnsSoon",
            d.returnsSoon
        );


        setText(
            "warrantiesSoon",
            d.warrantiesSoon
        );


        setText(
            "averagePrice",
            "₹" +
            formatMoney(
                d.averagePrice
            )
        );


        setText(
            "priceDropCount",
            d.priceDrops
        );


        setText(
            "activeReturns",
            d.activeReturns
        );


        setText(
            "activeWarranties",
            d.activeWarranties
        );

    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );
    }
}


function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;
    }
}


// ============================================================
// SMART ALERTS
// ============================================================

function updateSmartAlerts() {

    const alertsList =
        document.getElementById(
            "alertsList"
        );


    const alertCount =
        document.getElementById(
            "alertCount"
        );


    if (!alertsList) {

        return;
    }


    alertsList.innerHTML =
        "";


    const alerts = [];


    purchases.forEach(
        purchase => {

            const returnDeadline =
                getReturnDeadline(
                    purchase
                );


            const returnDays =
                getDaysRemaining(
                    returnDeadline
                );


            const warrantyDeadline =
                getWarrantyDeadline(
                    purchase
                );


            const warrantyDays =
                getDaysRemaining(
                    warrantyDeadline
                );


            const savings =
                getSavings(
                    purchase
                );


            if (
                returnDays > 0 &&
                returnDays <= 7
            ) {

                alerts.push({

                    type:
                        returnDays <= 3
                            ? "danger"
                            : "warning",

                    title:
                        "🔔 Return deadline approaching",

                    text:
                        `<strong>${escapeHTML(
                            purchase.productName
                        )}</strong><br>${returnDays} days remaining. Return by ${formatDate(
                            returnDeadline
                        )}.`
                });
            }


            if (
                returnDays <= 0
            ) {

                alerts.push({

                    type:
                        "danger",

                    title:
                        "🔴 Return period expired",

                    text:
                        `<strong>${escapeHTML(
                            purchase.productName
                        )}</strong><br>The return period ended on ${formatDate(
                            returnDeadline
                        )}.`
                });
            }


            if (
                warrantyDays > 0 &&
                warrantyDays <= 30
            ) {

                alerts.push({

                    type:
                        "warranty",

                    title:
                        "🛡️ Warranty expiring soon",

                    text:
                        `<strong>${escapeHTML(
                            purchase.productName
                        )}</strong><br>${warrantyDays} days remaining. Warranty ends on ${formatDate(
                            warrantyDeadline
                        )}.`
                });
            }


            if (
                savings > 0
            ) {

                alerts.push({

                    type:
                        "warning",

                    title:
                        "💰 Price drop detected",

                    text:
                        `<strong>${escapeHTML(
                            purchase.productName
                        )}</strong><br>Potential saving: ₹${formatMoney(
                            savings
                        )}.`
                });
            }

        }
    );


    if (
        !alerts.length
    ) {

        alertsList.innerHTML = `

            <div class="no-alerts">

                <strong>
                    ✓ Everything looks good
                </strong>

                <p>
                    No urgent return, warranty,
                    or price actions are currently needed.
                </p>

            </div>
        `;


        if (alertCount) {

            alertCount.textContent =
                "0";
        }


        return;
    }


    alerts.forEach(
        alert => {

            alertsList.innerHTML += `

                <div class="smart-alert ${alert.type}">

                    <div class="smart-alert-title">
                        ${alert.title}
                    </div>

                    <div class="smart-alert-text">
                        ${alert.text}
                    </div>

                </div>
            `;
        }
    );


    if (alertCount) {

        alertCount.textContent =
            alerts.length;
    }
}


// ============================================================
// FILTER
// ============================================================

function matchesFilter(
    purchase,
    filter
) {

    const returnDays =
        getDaysRemaining(
            getReturnDeadline(
                purchase
            )
        );


    const warrantyDays =
        getDaysRemaining(
            getWarrantyDeadline(
                purchase
            )
        );


    const savings =
        getSavings(
            purchase
        );


    switch (
        filter
    ) {

        case "priceDrop":

            return savings > 0;


        case "returnActive":

            return returnDays > 0;


        case "returnSoon":

            return (
                returnDays > 0 &&
                returnDays <= 7
            );


        case "warrantyActive":

            return warrantyDays > 0;


        case "warrantySoon":

            return (
                warrantyDays > 0 &&
                warrantyDays <= 30
            );


        default:

            return true;
    }
}


// ============================================================
// SORT
// ============================================================

function sortPurchases(
    list,
    sort
) {

    return list.sort(
        (a, b) => {

            switch (
                sort
            ) {

                case "oldest":

                    return (
                        new Date(
                            a.purchaseDate
                        ) -
                        new Date(
                            b.purchaseDate
                        )
                    );


                case "priceHigh":

                    return (
                        b.purchasePrice -
                        a.purchasePrice
                    );


                case "priceLow":

                    return (
                        a.purchasePrice -
                        b.purchasePrice
                    );


                case "savingsHigh":

                    return (
                        getSavings(b) -
                        getSavings(a)
                    );


                case "returnSoonest":

                    return (
                        getReturnDeadline(a) -
                        getReturnDeadline(b)
                    );


                case "warrantySoonest":

                    return (
                        getWarrantyDeadline(a) -
                        getWarrantyDeadline(b)
                    );


                case "newest":

                default:

                    return (
                        new Date(
                            b.purchaseDate
                        ) -
                        new Date(
                            a.purchaseDate
                        )
                    );
            }
        }
    );
}


// ============================================================
// DISPLAY
// ============================================================

function displayPurchases() {

    const purchaseList =
        document.getElementById(
            "purchaseList"
        );


    if (!purchaseList) {

        return;
    }


    const search =
        (
            document.getElementById(
                "searchInput"
            )?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const filter =
        document.getElementById(
            "filterSelect"
        )?.value ||
        "all";


    const sort =
        document.getElementById(
            "sortSelect"
        )?.value ||
        "newest";


    let filtered =
        purchases.filter(
            purchase => {

                const matchesSearch =
                    String(
                        purchase.productName
                    )
                        .toLowerCase()
                        .includes(
                            search
                        );


                return (

                    matchesSearch &&

                    matchesFilter(
                        purchase,
                        filter
                    )
                );
            }
        );


    filtered =
        sortPurchases(
            filtered,
            sort
        );


    purchaseList.innerHTML =
        "";


    updateDashboard();

    updateSmartAlerts();


    const countLabel =
        document.getElementById(
            "purchaseCountLabel"
        );


    if (countLabel) {

        countLabel.textContent =
            filtered.length +
            (
                filtered.length === 1
                    ? " purchase"
                    : " purchases"
            );
    }


    if (
        !purchases.length
    ) {

        purchaseList.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    🛍️
                </div>

                <h3>
                    No purchases yet
                </h3>

                <p>
                    Add your first purchase and
                    let AfterBuy AI monitor it for you.
                </p>

                <button
                    class="primary-btn"
                    onclick="showPurchaseForm()"
                >
                    ➕ Add Purchase
                </button>

            </div>
        `;

        return;
    }


    if (
        !filtered.length
    ) {

        purchaseList.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    🔍
                </div>

                <h3>
                    No matching purchases
                </h3>

                <p>
                    Try changing your search or filter.
                </p>

            </div>
        `;

        return;
    }


    filtered.forEach(
        purchase => {

            purchaseList.appendChild(
                createPurchaseCard(
                    purchase
                )
            );
        }
    );
}


// ============================================================
// PURCHASE CARD
// ============================================================

function createPurchaseCard(
    purchase
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "product-card";


    const savings =
        getSavings(
            purchase
        );


    const returnDeadline =
        getReturnDeadline(
            purchase
        );


    const warrantyDeadline =
        getWarrantyDeadline(
            purchase
        );


    const returnStatus =
        getReturnStatus(
            purchase
        );


    const warrantyStatus =
        getWarrantyStatus(
            purchase
        );


    const id =
        purchase._id ||
        purchase.id;


    card.innerHTML = `

        <div class="product-header">

            <div>

                <h3>
                    ${escapeHTML(
                        purchase.productName
                    )}
                </h3>

            </div>


            ${
                savings > 0
                    ? `
                        <span class="savings-badge">

                            💰 Save ₹${formatMoney(
                                savings
                            )}

                        </span>
                    `
                    : ""
            }

        </div>


        <div class="product-details">

            <div class="detail-row">
                <strong>
                    Purchase Price:
                </strong>

                ₹${formatMoney(
                    purchase.purchasePrice
                )}
            </div>


            <div class="detail-row">
                <strong>
                    Purchase Date:
                </strong>

                ${formatDate(
                    getPurchaseDate(
                        purchase
                    )
                )}
            </div>


            <div class="detail-row">
                <strong>
                    Return Period:
                </strong>

                ${purchase.returnPeriod} days
            </div>


            <div class="detail-row">
                <strong>
                    Return Deadline:
                </strong>

                ${formatDate(
                    returnDeadline
                )}
            </div>


            <div class="detail-row">
                <strong>
                    Warranty:
                </strong>

                ${purchase.warranty} months
            </div>


            <div class="detail-row">
                <strong>
                    Warranty Deadline:
                </strong>

                ${formatDate(
                    warrantyDeadline
                )}
            </div>


            <div class="detail-row">
                <strong>
                    Current Price:
                </strong>

                ₹${formatMoney(
                    purchase.currentPrice
                )}
            </div>


            <div class="detail-row">
                <strong>
                    Potential Savings:
                </strong>

                ₹${formatMoney(
                    savings
                )}
            </div>

        </div>


        <div class="alert ${returnStatus.className}">
            ${returnStatus.message}
        </div>


        <div class="alert ${warrantyStatus.className}">
            ${warrantyStatus.message}
        </div>


        <div class="product-actions">

            <button
                class="small-btn"
                onclick="editPurchase('${id}')"
            >
                ✏️ Edit
            </button>


            <button
                class="small-btn"
                onclick="updateCurrentPrice('${id}')"
            >
                💰 Update Price
            </button>


            <button
                class="small-btn"
                onclick="showPriceHistory('${id}')"
            >
                📈 Price History
            </button>


            <button
                class="small-btn"
                onclick="showRecommendation('${id}')"
            >
                🤖 AI Recommendation
            </button>


            <button
                class="small-btn danger"
                onclick="deletePurchase('${id}')"
            >
                🗑️ Delete
            </button>

        </div>
    `;


    return card;
}


// ============================================================
// EDIT
// ============================================================

function editPurchase(
    id
) {

    const purchase =
        findPurchase(id);


    if (!purchase) {

        alert(
            "Purchase not found."
        );

        return;
    }


    document.getElementById(
        "productName"
    ).value =
        purchase.productName;


    document.getElementById(
        "purchasePrice"
    ).value =
        purchase.purchasePrice;


    document.getElementById(
        "purchaseDate"
    ).value =
        purchase.purchaseDate;


    document.getElementById(
        "returnPeriod"
    ).value =
        purchase.returnPeriod;


    document.getElementById(
        "warranty"
    ).value =
        purchase.warranty;


    document.getElementById(
        "currentPrice"
    ).value =
        purchase.currentPrice;


    document.getElementById(
        "editingPurchaseId"
    ).value =
        purchase._id;


    document.getElementById(
        "formTitle"
    ).textContent =
        "Edit Purchase";


    document.getElementById(
        "saveButtonText"
    ).textContent =
        "Update Purchase";


    document.getElementById(
        "purchaseForm"
    ).style.display =
        "block";


    window.scrollTo({

        top:
            document.getElementById(
                "purchaseForm"
            ).offsetTop - 20,

        behavior:
            "smooth"
    });
}


// ============================================================
// UPDATE PRICE
// ============================================================

async function updateCurrentPrice(
    id
) {

    const purchase =
        findPurchase(id);


    if (!purchase) {

        return;
    }


    const newPrice =
        prompt(
            "Enter the latest current price (₹):",
            purchase.currentPrice
        );


    if (
        newPrice === null
    ) {

        return;
    }


    const price =
        Number(
            newPrice
        );


    if (
        !Number.isFinite(price) ||
        price <= 0
    ) {

        alert(
            "Please enter a valid price."
        );

        return;
    }


    try {

        const result =
            await apiRequest(
                `/purchases/${id}/price`,
                {

                    method:
                        "PATCH",

                    body:
                        JSON.stringify({
                            price
                        })
                }
            );


        replaceLocalPurchase(
            result.purchase
        );


        displayPurchases();


        alert(
            "Current price updated successfully."
        );

    } catch (error) {

        alert(
            error.message
        );
    }
}


// ============================================================
// PRICE HISTORY
// ============================================================

async function showPriceHistory(
    id
) {

    const purchase =
        findPurchase(id);


    if (!purchase) {

        return;
    }


    try {

        const result =
            await apiRequest(
                `/purchases/${id}/history`
            );


        const history =
            result.history || [];


        if (
            !history.length
        ) {

            alert(
                "No price history available."
            );

            return;
        }


        const prices =
            history.map(
                item =>
                    Number(
                        item.price
                    )
            );


        const highest =
            Math.max(
                ...prices
            );


        const lowest =
            Math.min(
                ...prices
            );


        const latest =
            prices[
                prices.length - 1
            ];


        document.getElementById(
            "historyTitle"
        ).textContent =
            purchase.productName +
            " — Price History";


        document.getElementById(
            "historySummary"
        ).innerHTML = `

            <div class="history-stat">

                <span>
                    Latest Price
                </span>

                <strong>
                    ₹${formatMoney(
                        latest
                    )}
                </strong>

            </div>


            <div class="history-stat">

                <span>
                    Lowest Price
                </span>

                <strong>
                    ₹${formatMoney(
                        lowest
                    )}
                </strong>

            </div>


            <div class="history-stat">

                <span>
                    Highest Price
                </span>

                <strong>
                    ₹${formatMoney(
                        highest
                    )}
                </strong>

            </div>
        `;


        document.getElementById(
            "historyTable"
        ).innerHTML = `

            <table>

                <thead>

                    <tr>

                        <th>
                            Date
                        </th>

                        <th>
                            Price
                        </th>

                    </tr>

                </thead>


                <tbody>

                    ${history
                        .slice()
                        .reverse()
                        .map(
                            item => `

                                <tr>

                                    <td>
                                        ${formatDate(
                                            new Date(
                                                item.date +
                                                "T00:00:00"
                                            )
                                        )}
                                    </td>

                                    <td>
                                        ₹${formatMoney(
                                            item.price
                                        )}
                                    </td>

                                </tr>
                            `
                        )
                        .join("")}

                </tbody>

            </table>
        `;


        document.getElementById(
            "historyModal"
        ).style.display =
            "flex";


        drawPriceChart(
            history
        );

    } catch (error) {

        alert(
            error.message
        );
    }
}


function closeHistoryModal() {

    const modal =
        document.getElementById(
            "historyModal"
        );


    if (modal) {

        modal.style.display =
            "none";
    }
}


function closeHistoryOutside(
    event
) {

    if (
        event.target.id ===
        "historyModal"
    ) {

        closeHistoryModal();
    }
}


// ============================================================
// PRICE CHART
// ============================================================

function drawPriceChart(
    history
) {

    const canvas =
        document.getElementById(
            "priceChart"
        );


    if (!canvas) {

        return;
    }


    const ctx =
        canvas.getContext(
            "2d"
        );


    const width =
        canvas.width;


    const height =
        canvas.height;


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    const padding =
        55;


    const prices =
        history.map(
            item =>
                Number(
                    item.price
                )
        );


    if (
        prices.length ===
        1
    ) {

        prices.push(
            prices[0]
        );
    }


    const minPrice =
        Math.min(
            ...prices
        );


    const maxPrice =
        Math.max(
            ...prices
        );


    const range =
        maxPrice -
        minPrice ||
        1;


    ctx.strokeStyle =
        "#e5e7eb";


    ctx.lineWidth =
        1;


    for (
        let i = 0;
        i <= 4;
        i++
    ) {

        const y =
            padding +
            (
                (
                    height -
                    padding * 2
                ) /
                4
            ) *
            i;


        ctx.beginPath();


        ctx.moveTo(
            padding,
            y
        );


        ctx.lineTo(
            width -
            padding,
            y
        );


        ctx.stroke();
    }


    ctx.beginPath();


    history.forEach(
        (item, index) => {

            const x =
                padding +
                (
                    index /
                    Math.max(
                        history.length -
                        1,
                        1
                    )
                ) *
                (
                    width -
                    padding * 2
                );


            const y =
                height -
                padding -
                (
                    (
                        Number(
                            item.price
                        ) -
                        minPrice
                    ) /
                    range
                ) *
                (
                    height -
                    padding * 2
                );


            if (
                index ===
                0
            ) {

                ctx.moveTo(
                    x,
                    y
                );

            } else {

                ctx.lineTo(
                    x,
                    y
                );
            }
        }
    );


    ctx.strokeStyle =
        "#2563eb";


    ctx.lineWidth =
        4;


    ctx.stroke();
}


// ============================================================
// AI RECOMMENDATION
// ============================================================

async function showRecommendation(
    id
) {

    const purchase =
        findPurchase(id);


    if (!purchase) {

        return;
    }


    try {

        const result =
            await apiRequest(
                `/ai/${id}`
            );


        const data =
            result.recommendation;


        const priorityClass =
            data.priority ===
                "HIGH"
                ? "status-danger"
                : data.priority ===
                    "MEDIUM"
                    ? "status-warning"
                    : "status-good";


        document.getElementById(
            "aiContent"
        ).innerHTML = `

            <div class="ai-recommendation">

                <h3>
                    🤖 ${escapeHTML(
                        data.title
                    )}
                </h3>

                <p>
                    ${escapeHTML(
                        data.message
                    )}
                </p>

            </div>


            <div class="ai-recommendation">

                <h3>
                    💰 Price Analysis
                </h3>

                <p>

                    Purchase price:
                    <strong>
                        ₹${formatMoney(
                            purchase.purchasePrice
                        )}
                    </strong>

                    <br>

                    Current price:
                    <strong>
                        ₹${formatMoney(
                            purchase.currentPrice
                        )}
                    </strong>

                    <br>

                    Potential savings:
                    <strong>
                        ₹${formatMoney(
                            data.savings
                        )}
                    </strong>

                </p>

            </div>
        `;


        document.getElementById(
            "aiModal"
        ).style.display =
            "flex";

    } catch (error) {

        alert(
            error.message
        );
    }
}


function closeAIModal() {

    const modal =
        document.getElementById(
            "aiModal"
        );


    if (modal) {

        modal.style.display =
            "none";
    }
}


function closeAIModalOutside(
    event
) {

    if (
        event.target.id ===
        "aiModal"
    ) {

        closeAIModal();
    }
}


// ============================================================
// DELETE
// ============================================================

async function deletePurchase(
    id
) {

    const purchase =
        findPurchase(id);


    if (!purchase) {

        return;
    }


    const confirmed =
        confirm(
            `Delete ${purchase.productName}?\n\nThis action cannot be undone.`
        );


    if (!confirmed) {

        return;
    }


    try {

        await apiRequest(
            `/purchases/${id}`,
            {
                method:
                    "DELETE"
            }
        );


        purchases =
            purchases.filter(
                item =>
                    String(
                        item._id
                    ) !==
                    String(id)
            );


        displayPurchases();


        alert(
            "Purchase deleted successfully."
        );

    } catch (error) {

        alert(
            error.message
        );
    }
}


// ============================================================
// EXPORT
// ============================================================

async function exportData() {

    try {

        const result =
            await apiRequest(
                "/data/export"
            );


        const data =
            JSON.stringify(
                result,
                null,
                2
            );


        const blob =
            new Blob(
                [data],
                {
                    type:
                        "application/json"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;


        link.download =
            `afterbuy-ai-backup-${formatDateInput(
                new Date()
            )}.json`;


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
            url
        );


        alert(
            "Your AfterBuy AI data has been exported."
        );

    } catch (error) {

        alert(
            error.message
        );
    }
}


// ============================================================
// IMPORT
// ============================================================

function importData(
    event
) {

    const file =
        event.target.files[0];


    if (!file) {

        return;
    }


    const reader =
        new FileReader();


    reader.onload =
        async function () {

            try {

                const data =
                    JSON.parse(
                        reader.result
                    );


                const imported =
                    Array.isArray(
                        data
                    )
                        ? data
                        : data.purchases;


                if (
                    !Array.isArray(
                        imported
                    )
                ) {

                    throw new Error(
                        "Invalid backup format."
                    );
                }


                const confirmed =
                    confirm(
                        `Import ${imported.length} purchases?\n\nThis will replace your current purchase data.`
                    );


                if (!confirmed) {

                    event.target.value =
                        "";

                    return;
                }


                await apiRequest(
                    "/data/import",
                    {

                        method:
                            "POST",

                        body:
                            JSON.stringify({
                                purchases:
                                    imported
                            })
                    }
                );


                await loadPurchases();


                alert(
                    "Purchase data imported successfully."
                );

            } catch (error) {

                alert(
                    "Import failed:\n\n" +
                    error.message
                );
            }


            event.target.value =
                "";
        };


    reader.readAsText(
        file
    );
}


// ============================================================
// NOTIFICATIONS
// ============================================================

function notificationsSupported() {

    return (
        "Notification" in
        window
    );
}


async function enableNotifications() {

    if (
        !notificationsSupported()
    ) {

        alert(
            "This browser does not support notifications."
        );

        return;
    }


    try {

        const permission =
            await Notification.requestPermission();


        updateNotificationUI();


        if (
            permission ===
            "granted"
        ) {

            await apiRequest(
                "/notifications/status",
                {

                    method:
                        "POST",

                    body:
                        JSON.stringify({

                            enabled:
                                true
                        })
                }
            );


            new Notification(
                "AfterBuy AI",
                {

                    body:
                        "Notifications are now enabled."
                }
            );

        } else {

            alert(
                "Notification permission was not granted."
            );
        }

    } catch (error) {

        console.error(
            error
        );

        alert(
            "Unable to enable notifications."
        );
    }
}


function updateNotificationUI() {

    const status =
        document.getElementById(
            "notificationStatus"
        );


    const button =
        document.getElementById(
            "notificationButton"
        );


    if (
        !status ||
        !button
    ) {

        return;
    }


    if (
        !notificationsSupported()
    ) {

        status.textContent =
            "Notifications are not supported by this browser.";

        button.disabled =
            true;

        return;
    }


    if (
        Notification.permission ===
        "granted"
    ) {

        status.textContent =
            "🟢 Notifications enabled";

        button.textContent =
            "Notifications Enabled";

        button.disabled =
            true;

        return;
    }


    if (
        Notification.permission ===
        "denied"
    ) {

        status.textContent =
            "🔴 Notifications blocked.";

        button.textContent =
            "Notifications Blocked";

        return;
    }


    status.textContent =
        "Notifications not enabled";

    button.textContent =
        "Enable Notifications";

    button.disabled =
        false;
}


// ============================================================
// NAVIGATION
// ============================================================

function scrollToPurchases() {

    const section =
        document.getElementById(
            "purchasesSection"
        );


    if (section) {

        section.scrollIntoView({
            behavior:
                "smooth"
        });
    }
}


// ============================================================
// KEYBOARD
// ============================================================

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key ===
            "Escape"
        ) {

            closeHistoryModal();

            closeAIModal();
        }
    }
);