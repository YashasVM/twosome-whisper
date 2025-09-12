# Twosome Whisper

A simple real-time chat application built with Vite, React, TypeScript, and Firebase.

## Features

* Real-time messaging
* User authentication
* Typing indicators
* Admin dashboard with usage analytics

## Technologies Used

* **Vite:** A next-generation frontend tooling that provides a faster and leaner development experience.
* **React:** A JavaScript library for building user interfaces.
* **TypeScript:** A typed superset of JavaScript that compiles to plain JavaScript.
* **Firebase:** A platform for building web and mobile applications, used here for authentication and real-time database.
* **shadcn-ui:** A collection of re-usable components that you can copy and paste into your apps.
* **Tailwind CSS:** A utility-first CSS framework for rapidly building custom designs.

## Getting Started

### Prerequisites

* Node.js and npm (or yarn/pnpm)
* A Firebase project with Authentication and Firestore enabled.

### Installation

1.  **Clone the repository:**

    ```bash
    git clone [https://github.com/yashasvm/twosome-whisper.git](https://github.com/yashasvm/twosome-whisper.git)
    cd twosome-whisper
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up Firebase:**
    * Create a `.env.local` file in the root of the project.
    * Add your Firebase project configuration to the `.env.local` file. You can find this in your Firebase project settings.

4.  **Run the development server:**

    ```bash
    npm run dev
    ```

Open [http://localhost:8080](http://localhost:8080) to view it in the browser.