# 🏥 Musawo Telehealth Mobile App

This repository contains the source code for the Musawo Telehealth mobile application, built using React Native and Firebase Firestore. The core system is designed for **dynamic, role-based content delivery** and features a scalable service architecture.

---

## 🚀 Key Architectural Highlights (The Solution)

The application uses a modular and data-driven approach, ensuring that service listings, options, and user roles are managed entirely through the Firebase backend, requiring minimal code changes for content updates.

### 1. Role-Based Routing

The system is designed to securely route users immediately after successful authentication based on a custom `role` field stored in Firestore.

* **Logic:** The `<RoleBasedApp>` component in `App.js` checks the `userRole` property (fetched from the **`/users`** collection) via the `UserProvider` global context.
* **Routing:**
    * `role: 'patient'` or `role: 'admin'` → Routes to the main **`MainTabNavigator`**.
    * `role: 'doctor'` or `role: 'pending_doctor'` → Routes to the dedicated **`DoctorTabNavigator`**.

### 2. Scalable Dynamic Service Flow

The patient's main experience is driven by two levels of data fetching from Firestore, ensuring new services can be added without updating the app code.

#### System Flow Diagram (The Solution in Terms of Flow)

| Step | Component | Data Source (Firestore Collection) | Key Operation & Purpose |
| :--- | :--- | :--- | :--- |
| **1. Service List** | **`HomeScreen.js`** | **`/services`** | Fetches the main menu categories (e.g., Vaccination, Chronic Illness, Lab). This list is sorted using the `order` field. |
| **2. Select Service** | **Navigation Stack** | *Uses `item.route` from Step 1* | Navigates to the generic `ServiceScreenTemplate` wrapper component (e.g., `ChronicHome.js`). |
| **3. Load Options** | **`ServiceScreenTemplate.js`** | **`/serviceName`** (e.g., `/chronicIllness`) | Fetches the specific packages/options available for that service (e.g., "Diabetes Management"). This is also sorted by the `order` field. |
| **4. Booking/Schedule** | **Booking Form Screen** | **`/appointments`** | **`addDoc`** operation. Saves the requested service, user details, and preferred time to the centralized appointments collection. |
| **5. Doctor Queue** | **`DoctorDashboardScreen.js`** | **`/appointments`** | Real-time listener (`onSnapshot`) queries the collection to display pending appointments, enabling doctors to accept or join calls. |

---

## 🛠️ Setup and Installation

To run this project locally, ensure you have Node.js and the Expo CLI installed.

1.  **Clone the Repository:**
    ```bash
    git clone [https://github.com/justusnuwagaba/musawo-app.git](https://github.com/justusnuwagaba/musawo-app.git)
    cd musawo-app
    ```
2.  **Install Dependencies:**
    ```bash
    npm install
    # OR
    yarn install
    ```
3.  **Configure Firebase:** Ensure your local `firebaseConfig.js` contains your correct API keys and that the necessary Firestore collections are populated (e.g., `/services`, `/chronicIllness`, etc.).
4.  **Run the App:**
    ```bash
    npm start
    # OR
    expo start
    ```
