# Virion Labs Platform: User Roles and Stories

This document provides a comprehensive overview of the distinct user roles within the Virion Labs ecosystem. For each role, it outlines their primary goals and the specific user stories that drive their interaction with the platform.

---

## 1. The Discord Member: The End-User

**Role Description:** The Discord Member is the target audience for the campaigns run on the Virion Labs platform. They are the community members, customers, and fans that Clients and Influencers aim to engage. Their journey is typically initiated by an external link or an interaction within a Discord server, and their experience is designed to be as seamless and intuitive as possible.

### User Stories:

*   **As a Discord Member, I want to click a referral link from an influencer so that I can easily join a community or get access to a special offer.**
    *   *Detail:* The entry point must be simple and trustworthy. The link should lead directly to a clear landing page that reinforces the offer or community I'm interested in.

*   **As a Discord Member, I want to join a Discord server from a landing page with a single click.**
    *   *Detail:* I don't want to hunt for an invite link. The "Join" button should immediately redirect me to the Discord invite, minimizing friction.

*   **As a Discord Member, I want to be automatically guided through an onboarding process when I join a new server so I know what to do next.**
    *   *Detail:* A new server can be confusing. I expect a welcome message or a pop-up form (modal) to appear, telling me what the server is about and what steps I need to take to get started.

*   **As a Discord Member, I want to use simple slash commands like `/join` or `/start` to discover and participate in campaigns directly within Discord.**
    *   *Detail:* If I'm already in a server, I want an easy way to find new opportunities without leaving the platform. Slash commands are the native, expected way to interact with bots.

*   **As a Discord Member, I want to fill out a simple form inside Discord to provide my information and get access to special roles or channels.**
    *   *Detail:* The process should be quick and contained within Discord. A modal form is ideal, as it doesn't require me to visit an external website and feels more secure.

*   **As a Discord Member, I want to receive a specific role automatically after completing a task, so I can unlock new permissions and content.**
    *   *Detail:* The reward for my participation should be instant. Upon submitting a form or completing an action, the bot should immediately grant me the promised role, giving me access to the exclusive channels or perks I was promised.

---

## 2. The Influencer: The Promoter

**Role Description:** The Influencer is a primary driver of user acquisition. They leverage their audience to bring new members into a Client's ecosystem. Their focus is on performance, monetization, and having access to tools that are both powerful and easy to use.

### User Stories:

*   **As an Influencer, I want to sign up to the platform easily to start monetizing my reach.**
    *   *Detail:* The registration process should be straightforward, allowing me to create an account and get to my dashboard quickly.

*   **As an Influencer, I want to create unique, trackable referral links for different platforms (e.g., YouTube, Instagram, TikTok).**
    *   *Detail:* I need to generate distinct links for each piece of content or platform to accurately measure which channels are most effective.

*   **As an Influencer, I want to track the performance of my links in real-time, including total clicks and successful conversions.**
    *   *Detail:* I need a dashboard that shows me up-to-the-minute data on how many people are clicking my links and how many are successfully joining the Discord server and completing the onboarding.

*   **As an Influencer, I want to see my conversion rate to understand how effective my promotional content is.**
    *   *Detail:* Beyond raw numbers, I need to see the percentage of clicks that lead to conversions. This key metric helps me refine my strategy and create more engaging content.

*   **As an Influencer, I want to manage all my referral links from a single dashboard, with options to activate, deactivate, or delete them.**
    *   *Detail:* I need full control over my links. I might want to create links in advance, pause a link for a campaign that is temporarily on hold, or remove old links that are no longer relevant.

*   **As an Influencer, I want to discover and request access to new marketing campaigns run by different brands.**
    *   *Detail:* The platform should be a place where I can find new opportunities. I want to browse available campaigns and easily submit a request to join those that are a good fit for my audience.

*   **As an Influencer, I want to generate QR codes for my links to use in offline promotions or on-stream overlays.**
    *   *Detail:* My marketing isn't just online links. I need the ability to download a QR code for my referral URL to make it easy for people to scan and join from a video or a physical location.

---

## 3. The Client: The Brand

**Role Description:** The Client is the business or brand that funds and directs the marketing campaigns. They are focused on achieving specific business goals, such as community growth, lead generation, or sales. They require tools for campaign management, customization, and measuring return on investment (ROI).

### User Stories:

*   **As a Client, I want to be onboarded to the platform with a simple wizard to create my first campaign.**
    *   *Detail:* Getting started should be a guided, step-by-step process. A wizard that walks me through setting up my business info, branding my bot, and configuring my first campaign is ideal.

*   **As a Client, I want to create and manage multiple marketing campaigns from a central dashboard.**
    *   *Detail:* I need a single place to see all my active, paused, and archived campaigns, allowing me to monitor their status and performance at a glance.

*   **As a Client, I want to customize a Discord bot with my own branding (name, logo, color) to represent my company.**
    *   *Detail:* The bot is an extension of my brand. I need to be able to control its appearance and personality to ensure it aligns with my company's image.

*   **As a Client, I want to define a specific onboarding flow for new members who join my Discord server.**
    *   *Detail:* I need to control the user journey. This includes customizing the questions in the onboarding form and defining the welcome messages the bot sends.

*   **As a Client, I want to track key metrics for my campaigns, including total interactions, successful onboardings, and referral conversions.**
    *   *Detail:* I need to measure success. The dashboard must provide clear, actionable data on how users are interacting with my campaign and how many are completing the entire flow.

*   **As a Client, I want to pause, resume, or archive campaigns to control their lifecycle.**
    *   *Detail:* Campaigns are not permanent. I need the flexibility to temporarily halt a campaign, restart it later, or mark it as complete while retaining its historical data.

*   **As a Client, I want to view detailed analytics to understand the ROI of my marketing spend.**
    *   *Detail:* I need to justify my investment. The platform must provide reports that help me understand the value generated by my campaigns and the influencers I partner with.

---

## 4. The Platform Administrator: The Operator

**Role Description:** The Administrator is a user from Virion Labs responsible for the overall health and management of the platform. They have the highest level of access and are tasked with managing clients, overseeing all platform activity, and ensuring the system's technical and operational integrity.

### User Stories:

*   **As an Administrator, I want to have a global view of all clients, influencers, and campaigns on the platform.**
    *   *Detail:* I need a "god-view" dashboard to monitor all activity across the entire system, allowing me to proactively identify issues or trends.

*   **As an Administrator, I want to add, view, edit, and delete client accounts.**
    *   *Detail:* I am responsible for the client lifecycle, from onboarding new brands to managing their accounts and offboarding them if necessary.

*   **As an Administrator, I want to create and deploy new Discord bots for clients.**
    *   *Detail:* I am the one who provisions the core bot infrastructure for new clients, linking their campaigns to a functional Discord application.

*   **As an Administrator, I want to manage all bot campaigns across all clients from a single, unified interface.**
    *   *Detail:* I need to be able to drill down into any specific campaign for any client to troubleshoot issues, review configurations, or assist the client directly.

*   **As an Administrator, I want to approve or deny requests from influencers who want to join restricted campaigns.**
    *   *Detail:* I act as the gatekeeper for exclusive campaigns, managing the queue of access requests and ensuring that only appropriate influencers are granted entry.

*   **As an Administrator, I want to ensure that key data points, like the number of influencers for a client, are automatically and accurately updated.**
    *   *Detail:* I need the system to be self-maintaining. Critical data should be updated via event-driven logic to ensure its accuracy without manual intervention.

*   **As an Administrator, I want to securely add other admin users via a command-line script, not through a public-facing page.**
    *   *Detail:* Admin access is highly privileged. Creating new admins must be a secure, offline process to prevent unauthorized access.

---

## The Role of the Discord Bot: The Bridge

The **Discord Bot** is not a user, but rather the critical piece of technology that connects the platform's strategic layer (the dashboard) with the end-user's experience in Discord. It is the automated agent that brings the campaigns to life.

*   **For Discord Members:** The bot is the face of the campaign. It is their guide, their point of interaction, and the enforcer of rules. It welcomes them, presents forms, responds to commands, and assigns roles, creating a structured and interactive experience.

*   **For Influencers:** The bot is the final, crucial link in their conversion funnel. It is responsible for detecting when a referred user joins the server and successfully completes the onboarding, which directly translates into the conversion metrics on the influencer's dashboard.

*   **For Clients:** The bot *is* the product they are customizing. It is their branded, 24/7 community manager that executes their campaign strategy, engages their users, and collects vital data on their behalf.

*   **For Administrators:** The bot is a deployable asset. They are responsible for the fleet of bots, ensuring they are configured correctly, deployed successfully, and remain online and operational for all clients.

In summary, the Virion Labs Dashboard is where campaigns are **designed, managed, and analyzed**, while the Discord Bot is where those campaigns are **executed, experienced, and ultimately, succeed or fail.**
