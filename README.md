# DecisionHub

### Collaborative Decision-Making & Community Polling Platform

DecisionHub is a full-stack web application designed to help individuals, groups, and communities make better decisions through structured polling, weighted option comparison, discussions, and analytics.

Users can create decisions with multiple options, vote on them, compare options using weighted parameters, participate in community discussions, and view voting analytics.

---

## 🚀 Features

### 🔐 Authentication & Authorization
- User registration and login
- JWT-based authentication
- Secure API access using Spring Security
- Role-based authorization for User and Admin
- Protected frontend routes

### 🗳️ Decision Boards & Polls
- Create and manage decision boards
- Add multiple options to a decision
- Participate in polls and voting
- Track voting results
- View decision details and outcomes

### ⚖️ Weighted Comparison System
One of DecisionHub's main features is its weighted comparison system.

Users can:
- Define comparison parameters such as Price, Quality, Performance, etc.
- Assign weights to parameters
- Rate different options against those parameters
- Calculate weighted scores
- Compare options using the calculated results

This allows users to make decisions based on multiple criteria instead of relying only on vote counts.

### 👥 Community Management
- Create communities
- Join existing communities
- Manage community join requests
- Manage community members
- Create community-specific decisions and polls
- Support private community discussions

### 📊 Analytics & Visualization
- Voting statistics
- Poll result visualization
- Decision analytics
- Community analytics
- Interactive charts using Recharts

### 💬 Discussions
- Comment on decisions
- Participate in discussions
- Reply to feedback
- Support community interaction around decisions

### 🛡️ Admin Dashboard
- User management
- Community management
- Poll and decision management
- Moderation features
- Platform analytics
- Reports and feedback management

### 🎨 Dynamic Theming
DecisionHub supports multiple UI themes:

- Neon Dark
- Cyberpunk Pink
- Emerald Glow
- Classic Slate

The selected theme is stored in LocalStorage and restored when the user returns.

---

## 🏗️ System Architecture

```text
                         ┌─────────────────────┐
                         │       User          │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   React Frontend    │
                         │      React 19       │
                         │       Vite          │
                         └──────────┬──────────┘
                                    │
                              REST API / Axios
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Spring Boot API   │
                         │       Java 21       │
                         │   Spring Security   │
                         │        JWT          │
                         └──────────┬──────────┘
                                    │
                         Spring Data JPA
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │     PostgreSQL      │
                         │      Database       │
                         └─────────────────────┘
