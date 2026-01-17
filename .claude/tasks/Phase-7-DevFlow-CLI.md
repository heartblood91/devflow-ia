# Phase 7 : DevFlow CLI

**Durée :** Semaine 8 (5 jours)
**Statut :** 🟡 À faire
**Responsable :** Développeur (Cédric) + Jean-Claude (PM)

---

## Objectifs

- [ ] Créer CLI DevFlow (Rust)
- [ ] Commandes CRUD tasks (add, list, update, delete)
- [ ] Authentification CLI → DevFlow API
- [ ] Workspace Claude Code (task-creator.md)
- [ ] Flow complet : Voice → Transcript → Claude Code → CLI → DevFlow

---

## Tasks

### 7.1 Setup CLI (Rust + Clap)

**Durée estimée :** 4h

#### Structure

```
devflow-cli/
├── src/
│   ├── commands/
│   │   ├── mod.rs          # Module exports
│   │   ├── auth.rs         # login, logout, whoami
│   │   ├── tasks.rs        # add, list, update, delete, show
│   │   ├── planning.rs     # plan, week
│   │   └── stats.rs        # stats, insights
│   ├── utils/
│   │   ├── mod.rs          # Module exports
│   │   ├── api.rs          # API client (reqwest)
│   │   ├── config.rs       # Config management (~/.devflow/config.json)
│   │   └── logger.rs       # Console logging
│   ├── types.rs            # Shared types/structs
│   └── main.rs             # Entry point
├── tests/
│   └── integration_tests.rs
├── Cargo.toml
└── README.md
```

#### Setup

- [ ] Initialiser le projet Rust :

  ```bash
  cargo new devflow-cli
  cd devflow-cli
  ```

- [ ] Configurer `Cargo.toml` :

```toml
[package]
name = "devflow"
version = "1.0.0"
edition = "2021"
authors = ["Cédric <cedric@devflow.io>"]
description = "DevFlow CLI - Productivity system for 10x developers"
license = "MIT"
repository = "https://github.com/heartblood91/devflow-cli"

[[bin]]
name = "devflow"
path = "src/main.rs"

[dependencies]
# CLI framework
clap = { version = "4.5", features = ["derive", "env"] }

# HTTP client
reqwest = { version = "0.12", features = ["json", "blocking"] }

# JSON serialization
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# Async runtime
tokio = { version = "1.0", features = ["full"] }

# Terminal colors
colored = "2.1"

# Interactive prompts
dialoguer = { version = "0.11", features = ["password"] }

# Error handling
anyhow = "1.0"
thiserror = "1.0"

# Environment variables
dotenvy = "0.15"

# Home directory
dirs = "5.0"

# Date/time
chrono = { version = "0.4", features = ["serde"] }

[dev-dependencies]
assert_cmd = "2.0"
predicates = "3.1"
tempfile = "3.12"
```

- [ ] Créer `src/main.rs` :

```rust
use clap::{Parser, Subcommand};
use colored::*;

mod commands;
mod types;
mod utils;

use commands::{auth, planning, stats, tasks};

/// DevFlow CLI - Productivity system for 10x developers
#[derive(Parser)]
#[command(name = "devflow")]
#[command(author, version, about, long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Login to DevFlow
    Login,

    /// Logout from DevFlow
    Logout,

    /// Show current user
    Whoami,

    /// Create a new task
    Add {
        /// Task title
        title: String,

        /// Task description
        #[arg(short, long)]
        description: Option<String>,

        /// Priority (sacred/important/optional)
        #[arg(short, long, default_value = "optional")]
        priority: String,

        /// Difficulty (1-5)
        #[arg(long, default_value = "3")]
        difficulty: u8,

        /// Estimated duration (minutes)
        #[arg(short, long)]
        estimate: Option<u32>,

        /// Deadline (YYYY-MM-DD)
        #[arg(long)]
        deadline: Option<String>,

        /// Quarter (Q1-2026, etc.)
        #[arg(short, long)]
        quarter: Option<String>,
    },

    /// List all tasks
    List {
        /// Filter by status (inbox/todo/doing/done)
        #[arg(short, long)]
        status: Option<String>,

        /// Filter by priority
        #[arg(short, long)]
        priority: Option<String>,
    },

    /// Show task details
    Show {
        /// Task ID
        task_id: String,
    },

    /// Update a task
    Update {
        /// Task ID
        task_id: String,

        /// New title
        #[arg(short, long)]
        title: Option<String>,

        /// New priority
        #[arg(short, long)]
        priority: Option<String>,

        /// New status
        #[arg(long)]
        status: Option<String>,
    },

    /// Delete a task
    Delete {
        /// Task ID
        task_id: String,

        /// Skip confirmation
        #[arg(short, long)]
        force: bool,
    },

    /// Generate weekly planning
    Plan,

    /// Show current week planning
    Week,

    /// Show productivity stats
    Stats {
        /// Show weekly stats
        #[arg(short, long)]
        week: bool,

        /// Show monthly stats
        #[arg(short, long)]
        month: bool,
    },
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();

    match cli.command {
        // Auth commands
        Commands::Login => auth::login().await?,
        Commands::Logout => auth::logout()?,
        Commands::Whoami => auth::whoami()?,

        // Task commands
        Commands::Add {
            title,
            description,
            priority,
            difficulty,
            estimate,
            deadline,
            quarter,
        } => {
            tasks::add(
                title,
                description,
                priority,
                difficulty,
                estimate,
                deadline,
                quarter,
            )
            .await?
        }
        Commands::List { status, priority } => tasks::list(status, priority).await?,
        Commands::Show { task_id } => tasks::show(&task_id).await?,
        Commands::Update {
            task_id,
            title,
            priority,
            status,
        } => tasks::update(&task_id, title, priority, status).await?,
        Commands::Delete { task_id, force } => tasks::delete(&task_id, force).await?,

        // Planning commands
        Commands::Plan => planning::plan().await?,
        Commands::Week => planning::week().await?,

        // Stats commands
        Commands::Stats { week, month } => stats::stats(week, month).await?,
    }

    Ok(())
}
```

- [ ] Créer `src/commands/mod.rs` :

```rust
pub mod auth;
pub mod planning;
pub mod stats;
pub mod tasks;
```

- [ ] Créer `src/utils/mod.rs` :

```rust
pub mod api;
pub mod config;
pub mod logger;
```

**Tests :**

- [ ] Test `devflow --help` → affiche commands
- [ ] Test `devflow --version` → affiche version

---

### 7.2 Auth Commands

**Durée estimée :** 4h

#### Login

- [ ] Créer `src/commands/auth.rs` :

```rust
use anyhow::Result;
use colored::*;
use dialoguer::{Input, Password};

use crate::utils::{api::ApiClient, config::Config, logger};

pub async fn login() -> Result<()> {
    logger::info("Login to DevFlow");

    let email: String = Input::new()
        .with_prompt("Email")
        .validate_with(|input: &String| {
            if input.contains('@') {
                Ok(())
            } else {
                Err("Invalid email")
            }
        })
        .interact_text()?;

    let password: String = Password::new()
        .with_prompt("Password")
        .interact()?;

    let client = ApiClient::new()?;

    match client.login(&email, &password).await {
        Ok((token, user)) => {
            let mut config = Config::load()?;
            config.set_token(&token);
            config.set_user(&user);
            config.save()?;

            logger::success(&format!("Logged in as {}", user.email.bold()));
        }
        Err(e) => {
            logger::error(&format!("Login failed: {}", e));
            std::process::exit(1);
        }
    }

    Ok(())
}

pub fn logout() -> Result<()> {
    let mut config = Config::load()?;
    config.clear();
    config.save()?;

    logger::success("Logged out");
    Ok(())
}

pub fn whoami() -> Result<()> {
    let config = Config::load()?;

    match config.get_user() {
        Some(user) => {
            logger::info(&format!("Logged in as {}", user.email.bold()));
            logger::info(&format!("User ID: {}", user.id));
        }
        None => {
            logger::error("Not logged in. Run `devflow login` first.");
            std::process::exit(1);
        }
    }

    Ok(())
}
```

#### Config Management

- [ ] Créer `src/utils/config.rs` :

```rust
use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct User {
    pub id: String,
    pub email: String,
    pub name: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ConfigData {
    pub token: Option<String>,
    pub user: Option<User>,
    pub api_url: Option<String>,
}

pub struct Config {
    path: PathBuf,
    data: ConfigData,
}

impl Config {
    fn config_dir() -> PathBuf {
        dirs::home_dir()
            .expect("Could not find home directory")
            .join(".devflow")
    }

    fn config_file() -> PathBuf {
        Self::config_dir().join("config.json")
    }

    pub fn load() -> Result<Self> {
        let config_dir = Self::config_dir();
        let config_file = Self::config_file();

        if !config_dir.exists() {
            fs::create_dir_all(&config_dir)?;
        }

        let data = if config_file.exists() {
            let raw = fs::read_to_string(&config_file)?;
            serde_json::from_str(&raw)?
        } else {
            ConfigData::default()
        };

        Ok(Self {
            path: config_file,
            data,
        })
    }

    pub fn save(&self) -> Result<()> {
        let json = serde_json::to_string_pretty(&self.data)?;
        fs::write(&self.path, json)?;
        Ok(())
    }

    pub fn get_token(&self) -> Option<&str> {
        self.data.token.as_deref()
    }

    pub fn set_token(&mut self, token: &str) {
        self.data.token = Some(token.to_string());
    }

    pub fn get_user(&self) -> Option<&User> {
        self.data.user.as_ref()
    }

    pub fn set_user(&mut self, user: &User) {
        self.data.user = Some(user.clone());
    }

    pub fn get_api_url(&self) -> &str {
        self.data
            .api_url
            .as_deref()
            .unwrap_or("https://devflow.vercel.app/api")
    }

    pub fn clear(&mut self) {
        self.data = ConfigData::default();
    }
}
```

#### API Client

- [ ] Créer `src/utils/api.rs` :

```rust
use anyhow::{anyhow, Result};
use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE};
use serde::{de::DeserializeOwned, Deserialize, Serialize};

use crate::types::Task;
use crate::utils::config::{Config, User};

#[derive(Debug, Serialize)]
struct LoginRequest {
    email: String,
    password: String,
}

#[derive(Debug, Deserialize)]
struct LoginResponse {
    token: String,
    user: User,
}

pub struct ApiClient {
    client: reqwest::Client,
    base_url: String,
    token: Option<String>,
}

impl ApiClient {
    pub fn new() -> Result<Self> {
        let config = Config::load()?;
        let base_url = config.get_api_url().to_string();
        let token = config.get_token().map(|s| s.to_string());

        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(10))
            .build()?;

        Ok(Self {
            client,
            base_url,
            token,
        })
    }

    fn headers(&self) -> HeaderMap {
        let mut headers = HeaderMap::new();
        headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));

        if let Some(token) = &self.token {
            if let Ok(value) = HeaderValue::from_str(&format!("Bearer {}", token)) {
                headers.insert(AUTHORIZATION, value);
            }
        }

        headers
    }

    pub async fn login(&self, email: &str, password: &str) -> Result<(String, User)> {
        let url = format!("{}/cli/auth/login", self.base_url);
        let body = LoginRequest {
            email: email.to_string(),
            password: password.to_string(),
        };

        let response = self
            .client
            .post(&url)
            .headers(self.headers())
            .json(&body)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            return Err(anyhow!("Login failed ({}): {}", status, text));
        }

        let login_response: LoginResponse = response.json().await?;
        Ok((login_response.token, login_response.user))
    }

    pub async fn get<T: DeserializeOwned>(&self, endpoint: &str) -> Result<T> {
        let url = format!("{}{}", self.base_url, endpoint);

        let response = self
            .client
            .get(&url)
            .headers(self.headers())
            .send()
            .await?;

        self.handle_response(response).await
    }

    pub async fn post<T: DeserializeOwned, B: Serialize>(&self, endpoint: &str, body: &B) -> Result<T> {
        let url = format!("{}{}", self.base_url, endpoint);

        let response = self
            .client
            .post(&url)
            .headers(self.headers())
            .json(body)
            .send()
            .await?;

        self.handle_response(response).await
    }

    pub async fn put<T: DeserializeOwned, B: Serialize>(&self, endpoint: &str, body: &B) -> Result<T> {
        let url = format!("{}{}", self.base_url, endpoint);

        let response = self
            .client
            .put(&url)
            .headers(self.headers())
            .json(body)
            .send()
            .await?;

        self.handle_response(response).await
    }

    pub async fn delete(&self, endpoint: &str) -> Result<()> {
        let url = format!("{}{}", self.base_url, endpoint);

        let response = self
            .client
            .delete(&url)
            .headers(self.headers())
            .send()
            .await?;

        if response.status() == reqwest::StatusCode::UNAUTHORIZED {
            return Err(anyhow!("Unauthorized. Run `devflow login` first."));
        }

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            return Err(anyhow!("Request failed ({}): {}", status, text));
        }

        Ok(())
    }

    async fn handle_response<T: DeserializeOwned>(&self, response: reqwest::Response) -> Result<T> {
        if response.status() == reqwest::StatusCode::UNAUTHORIZED {
            return Err(anyhow!("Unauthorized. Run `devflow login` first."));
        }

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            return Err(anyhow!("Request failed ({}): {}", status, text));
        }

        let data = response.json().await?;
        Ok(data)
    }
}
```

#### Logger

- [ ] Créer `src/utils/logger.rs` :

```rust
use colored::*;

pub fn info(message: &str) {
    println!("{} {}", "ℹ".blue(), message);
}

pub fn success(message: &str) {
    println!("{} {}", "✓".green(), message);
}

pub fn error(message: &str) {
    eprintln!("{} {}", "✗".red(), message);
}

pub fn warn(message: &str) {
    println!("{} {}", "⚠".yellow(), message);
}
```

**Tests :**

- [ ] Test login → token saved in ~/.devflow/config.json
- [ ] Test whoami → affiche user email
- [ ] Test logout → config cleared

---

### 7.3 Task Commands

**Durée estimée :** 6h

#### Types

- [ ] Créer `src/types.rs` :

```rust
use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub priority: String,
    pub difficulty: u8,
    pub status: String,
    #[serde(rename = "estimatedDuration")]
    pub estimated_duration: Option<u32>,
    pub deadline: Option<DateTime<Utc>>,
    pub quarter: Option<String>,
    #[serde(rename = "kanbanColumn")]
    pub kanban_column: String,
    #[serde(rename = "createdAt")]
    pub created_at: DateTime<Utc>,
    #[serde(rename = "updatedAt")]
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct CreateTaskRequest {
    pub title: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub priority: String,
    pub difficulty: u8,
    #[serde(rename = "estimatedDuration", skip_serializing_if = "Option::is_none")]
    pub estimated_duration: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub deadline: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub quarter: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct UpdateTaskRequest {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub priority: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
}
```

#### Task Commands

- [ ] Créer `src/commands/tasks.rs` :

```rust
use anyhow::Result;
use colored::*;
use dialoguer::Input;

use crate::types::{CreateTaskRequest, Task, UpdateTaskRequest};
use crate::utils::{api::ApiClient, logger};

pub async fn add(
    title: String,
    description: Option<String>,
    priority: String,
    difficulty: u8,
    estimate: Option<u32>,
    deadline: Option<String>,
    quarter: Option<String>,
) -> Result<()> {
    logger::info(&format!("Creating task: {}", title.bold()));

    // If estimate not provided, ask
    let estimated_duration = match estimate {
        Some(e) => Some(e),
        None => {
            let answer: String = Input::new()
                .with_prompt("Estimated duration (minutes)")
                .default("60".to_string())
                .validate_with(|input: &String| {
                    input.parse::<u32>().map(|_| ()).map_err(|_| "Must be a number")
                })
                .interact_text()?;
            Some(answer.parse()?)
        }
    };

    let client = ApiClient::new()?;

    let request = CreateTaskRequest {
        title: title.clone(),
        description,
        priority,
        difficulty,
        estimated_duration,
        deadline,
        quarter,
    };

    match client.post::<Task, _>("/cli/tasks", &request).await {
        Ok(task) => {
            logger::success(&format!("Task created: {}", task.title.bold()));
            logger::info(&format!("Task ID: {}", task.id));
        }
        Err(e) => {
            logger::error(&format!("Failed to create task: {}", e));
            std::process::exit(1);
        }
    }

    Ok(())
}

pub async fn list(status: Option<String>, priority: Option<String>) -> Result<()> {
    let client = ApiClient::new()?;

    let mut endpoint = "/cli/tasks".to_string();
    let mut params = Vec::new();

    if let Some(s) = status {
        params.push(format!("status={}", s));
    }
    if let Some(p) = priority {
        params.push(format!("priority={}", p));
    }

    if !params.is_empty() {
        endpoint = format!("{}?{}", endpoint, params.join("&"));
    }

    match client.get::<Vec<Task>>(&endpoint).await {
        Ok(tasks) => {
            if tasks.is_empty() {
                logger::info("No tasks found.");
                return Ok(());
            }

            logger::info(&format!("Found {} tasks:\n", tasks.len().to_string().bold()));

            for task in tasks {
                let priority_icon = match task.priority.as_str() {
                    "sacred" => "🔴",
                    "important" => "🟠",
                    _ => "🟢",
                };

                let difficulty_stars = "⭐".repeat(task.difficulty as usize);

                println!(
                    "{} {} {}",
                    priority_icon,
                    task.title.bold(),
                    difficulty_stars
                );
                println!(
                    "   ID: {} | Status: {} | {} min",
                    task.id,
                    task.status,
                    task.estimated_duration.unwrap_or(0)
                );
                if let Some(deadline) = task.deadline {
                    println!("   Deadline: {}", deadline.format("%Y-%m-%d"));
                }
                println!();
            }
        }
        Err(e) => {
            logger::error(&format!("Failed to list tasks: {}", e));
            std::process::exit(1);
        }
    }

    Ok(())
}

pub async fn show(task_id: &str) -> Result<()> {
    let client = ApiClient::new()?;

    match client.get::<Task>(&format!("/cli/tasks/{}", task_id)).await {
        Ok(task) => {
            println!();
            println!("{}", task.title.bold());
            println!("{}", "─".repeat(task.title.len()));
            println!();
            println!("ID:           {}", task.id);
            println!("Priority:     {}", task.priority);
            println!("Difficulty:   {}", "⭐".repeat(task.difficulty as usize));
            println!("Status:       {}", task.status);
            println!(
                "Estimate:     {} min",
                task.estimated_duration.unwrap_or(0)
            );
            if let Some(deadline) = task.deadline {
                println!("Deadline:     {}", deadline.format("%Y-%m-%d"));
            }
            if let Some(quarter) = &task.quarter {
                println!("Quarter:      {}", quarter);
            }
            if let Some(description) = &task.description {
                println!();
                println!("Description:");
                println!("{}", description);
            }
            println!();
        }
        Err(e) => {
            logger::error(&format!("Failed to show task: {}", e));
            std::process::exit(1);
        }
    }

    Ok(())
}

pub async fn update(
    task_id: &str,
    title: Option<String>,
    priority: Option<String>,
    status: Option<String>,
) -> Result<()> {
    let client = ApiClient::new()?;

    let request = UpdateTaskRequest {
        title,
        priority,
        status,
    };

    match client
        .put::<Task, _>(&format!("/cli/tasks/{}", task_id), &request)
        .await
    {
        Ok(task) => {
            logger::success(&format!("Task updated: {}", task.title.bold()));
        }
        Err(e) => {
            logger::error(&format!("Failed to update task: {}", e));
            std::process::exit(1);
        }
    }

    Ok(())
}

pub async fn delete(task_id: &str, force: bool) -> Result<()> {
    if !force {
        let confirm = dialoguer::Confirm::new()
            .with_prompt("Are you sure you want to delete this task?")
            .default(false)
            .interact()?;

        if !confirm {
            logger::info("Cancelled.");
            return Ok(());
        }
    }

    let client = ApiClient::new()?;

    match client.delete(&format!("/cli/tasks/{}", task_id)).await {
        Ok(_) => {
            logger::success("Task deleted.");
        }
        Err(e) => {
            logger::error(&format!("Failed to delete task: {}", e));
            std::process::exit(1);
        }
    }

    Ok(())
}
```

#### Planning and Stats (stub)

- [ ] Créer `src/commands/planning.rs` :

```rust
use anyhow::Result;
use crate::utils::logger;

pub async fn plan() -> Result<()> {
    logger::info("Generating weekly planning...");
    // TODO: Implement planning generation
    logger::warn("Planning generation not yet implemented.");
    Ok(())
}

pub async fn week() -> Result<()> {
    logger::info("Fetching current week planning...");
    // TODO: Implement week display
    logger::warn("Week display not yet implemented.");
    Ok(())
}
```

- [ ] Créer `src/commands/stats.rs` :

```rust
use anyhow::Result;
use crate::utils::logger;

pub async fn stats(week: bool, month: bool) -> Result<()> {
    if week {
        logger::info("Fetching weekly stats...");
    } else if month {
        logger::info("Fetching monthly stats...");
    } else {
        logger::info("Fetching overall stats...");
    }
    // TODO: Implement stats
    logger::warn("Stats not yet implemented.");
    Ok(())
}
```

**Tests :**

- [ ] Test `devflow add "SEPA Backend" -p sacred --difficulty 4 -e 180`
- [ ] Test `devflow list` → affiche tasks
- [ ] Test `devflow show <taskId>` → affiche détails
- [ ] Test `devflow update <taskId> --status done`
- [ ] Test `devflow delete <taskId>` → confirmation

---

### 7.4 API Endpoints (Backend)

**Durée estimée :** 4h

> Note: Les endpoints backend restent en Next.js/TypeScript. Seule la CLI est en Rust.

#### Create CLI-specific Endpoints

- [ ] Créer `app/api/cli/auth/login/route.ts` :

```ts
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { sign } from "jsonwebtoken";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password } = body;

  // Verify credentials using Better Auth
  const result = await auth.api.signInEmail({
    body: { email, password },
  });

  if (!result.user) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Generate CLI token (JWT)
  const token = sign(
    { userId: result.user.id, email: result.user.email },
    process.env.AUTH_SECRET!,
    { expiresIn: "30d" },
  );

  return Response.json({
    token,
    user: {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
    },
  });
}
```

- [ ] Créer middleware pour CLI auth `src/lib/cli-auth.ts` :

```ts
import { NextRequest } from "next/server";
import { verify } from "jsonwebtoken";

export type CLIUser = {
  userId: string;
  email: string;
};

export function verifyCLIToken(req: NextRequest): CLIUser | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = verify(token, process.env.AUTH_SECRET!) as CLIUser;
    return decoded;
  } catch {
    return null;
  }
}
```

- [ ] Créer `app/api/cli/tasks/route.ts` :

```ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCLIToken } from "@/lib/cli-auth";

export async function GET(req: NextRequest) {
  const user = verifyCLIToken(req);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");

  const tasks = await prisma.task.findMany({
    where: {
      userId: user.userId,
      ...(status && { status }),
      ...(priority && { priority }),
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return Response.json(tasks);
}

export async function POST(req: NextRequest) {
  const user = verifyCLIToken(req);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const task = await prisma.task.create({
    data: {
      userId: user.userId,
      title: body.title,
      description: body.description,
      priority: body.priority,
      difficulty: body.difficulty,
      estimatedDuration: body.estimatedDuration,
      deadline: body.deadline ? new Date(body.deadline) : undefined,
      quarter: body.quarter,
      status: "inbox",
      kanbanColumn: "inbox",
    },
  });

  return Response.json(task);
}
```

- [ ] Créer `app/api/cli/tasks/[taskId]/route.ts` :

```ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCLIToken } from "@/lib/cli-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { taskId: string } },
) {
  const user = verifyCLIToken(req);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const task = await prisma.task.findUnique({
    where: {
      id: params.taskId,
      userId: user.userId,
    },
  });

  if (!task) {
    return Response.json({ error: "Task not found" }, { status: 404 });
  }

  return Response.json(task);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { taskId: string } },
) {
  const user = verifyCLIToken(req);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const task = await prisma.task.update({
    where: {
      id: params.taskId,
      userId: user.userId,
    },
    data: body,
  });

  return Response.json(task);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { taskId: string } },
) {
  const user = verifyCLIToken(req);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.task.delete({
    where: {
      id: params.taskId,
      userId: user.userId,
    },
  });

  return Response.json({ success: true });
}
```

**Tests :**

- [ ] Test GET /api/cli/tasks → returns tasks
- [ ] Test POST /api/cli/tasks → creates task
- [ ] Test GET /api/cli/tasks/:id → returns task
- [ ] Test PUT /api/cli/tasks/:id → updates task
- [ ] Test DELETE /api/cli/tasks/:id → deletes task

---

### 7.5 Build and Distribution

**Durée estimée :** 2h

#### Build for Multiple Platforms

- [ ] Configurer CI/CD pour cross-compilation :

```yaml
# .github/workflows/cli-release.yml
name: CLI Release

on:
  push:
    tags:
      - "cli-v*"

jobs:
  build:
    strategy:
      matrix:
        include:
          - os: ubuntu-latest
            target: x86_64-unknown-linux-gnu
            artifact: devflow-linux-x86_64
          - os: ubuntu-latest
            target: aarch64-unknown-linux-gnu
            artifact: devflow-linux-aarch64
          - os: macos-latest
            target: x86_64-apple-darwin
            artifact: devflow-macos-x86_64
          - os: macos-latest
            target: aarch64-apple-darwin
            artifact: devflow-macos-aarch64
          - os: windows-latest
            target: x86_64-pc-windows-msvc
            artifact: devflow-windows-x86_64.exe

    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v4

      - name: Install Rust
        uses: dtolnay/rust-action@stable
        with:
          targets: ${{ matrix.target }}

      - name: Build
        run: |
          cd devflow-cli
          cargo build --release --target ${{ matrix.target }}

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: ${{ matrix.artifact }}
          path: devflow-cli/target/${{ matrix.target }}/release/devflow*
```

#### Installation Instructions

- [ ] Créer `devflow-cli/README.md` :

```markdown
# DevFlow CLI

Productivity system for 10x developers.

## Installation

### macOS (Homebrew)

```bash
brew tap heartblood91/devflow
brew install devflow
```

### Linux

```bash
# Download the latest release
curl -L https://github.com/heartblood91/devflow-cli/releases/latest/download/devflow-linux-x86_64 -o devflow
chmod +x devflow
sudo mv devflow /usr/local/bin/
```

### Windows

Download the latest release from GitHub and add to PATH.

### From source (Rust)

```bash
cargo install --git https://github.com/heartblood91/devflow-cli
```

## Usage

```bash
# Login
devflow login

# Add a task
devflow add "Implement SEPA" -p sacred --difficulty 4 -e 180

# List tasks
devflow list

# Show task details
devflow show <task-id>

# Update task
devflow update <task-id> --status done

# Delete task
devflow delete <task-id>

# Logout
devflow logout
```

## Configuration

Config is stored in `~/.devflow/config.json`.
```

---

### 7.6 Workspace Claude Code (task-creator)

**Durée estimée :** 4h

#### Flow Complet

```
1. User brainstorme vocalement (ChatGPT Voice + Whisper)
2. Transcript sauvegardé dans ~/devflow-workspace/transcripts/brainstorm-2026-01-05.md
3. User ouvre Claude Code
4. User: "Claude, utilise task-creator pour importer mes tâches"
5. Claude Code lit .claude/task-creator.md + transcript
6. Claude Code parse les tâches du transcript
7. Claude Code génère commandes CLI DevFlow
8. User valide
9. Claude Code exécute commandes → Tâches créées dans DevFlow
```

#### Workspace Structure

- [ ] Créer workspace dir :

  ```bash
  mkdir -p ~/devflow-workspace/transcripts
  mkdir -p ~/devflow-workspace/.claude
  ```

- [ ] Créer `~/devflow-workspace/.claude/task-creator.md` :

````markdown
# Task Creator - DevFlow

Tu es un assistant qui aide à importer des tâches dans DevFlow à partir de transcripts vocaux.

## Ton rôle

1. Lire le transcript fourni par l'user
2. Parser toutes les tâches mentionnées
3. Pour chaque tâche, extraire :
   - Titre (concis, max 100 chars)
   - Description (optionnel)
   - Priorité (sacred/important/optional)
   - Difficulté estimée (1-5)
   - Durée estimée (minutes)
   - Deadline (si mentionné)
   - Quarter (si mentionné)
4. Générer commandes CLI DevFlow
5. Demander validation à l'user
6. Exécuter les commandes

## Exemples

### Transcript 1

```
User: "Bon, je dois implémenter le SEPA avec Stripe, c'est urgent et compliqué.
Je pense que ça va prendre 3h. Il y a aussi un bug sur les dons récurrents,
c'est simple mais important, 30 min max. Et puis je veux refacto le composant Navbar,
c'est pas urgent, 1h."
```

### Parsing

```
Tâche 1 :
- Titre : Implémenter SEPA avec Stripe
- Priorité : sacred (urgent)
- Difficulté : 4 (compliqué)
- Durée : 180 min (3h)

Tâche 2 :
- Titre : Fix bug dons récurrents
- Priorité : important
- Difficulté : 2 (simple)
- Durée : 30 min

Tâche 3 :
- Titre : Refacto composant Navbar
- Priorité : optional (pas urgent)
- Difficulté : 3
- Durée : 60 min (1h)
```

### Commandes CLI

```bash
devflow add "Implémenter SEPA avec Stripe" -p sacred --difficulty 4 -e 180
devflow add "Fix bug dons récurrents" -p important --difficulty 2 -e 30
devflow add "Refacto composant Navbar" -p optional --difficulty 3 -e 60
```

## Questions de clarification

Si des infos manquent, pose des questions :

- "Quelle est la priorité de [tâche] ?"
- "Combien de temps estimes-tu pour [tâche] ?"
- "Y a-t-il une deadline pour [tâche] ?"

## Output

Format final :

```
J'ai identifié 3 tâches. Voici les commandes CLI :

1. devflow add "..." -p sacred --difficulty 4 -e 180
2. devflow add "..." -p important --difficulty 2 -e 30
3. devflow add "..." -p optional --difficulty 3 -e 60

Valides-tu ?
```

Si user valide → exécute les commandes.
````

#### Exemple d'utilisation

- [ ] User crée transcript :

  ```bash
  cd ~/devflow-workspace/transcripts
  echo "Je dois faire le SEPA (urgent, 3h), fix bug dons (30 min), refacto Navbar (1h)." > brainstorm-2026-01-05.md
  ```

- [ ] User ouvre Claude Code :

  ```bash
  cd ~/devflow-workspace
  claude-code
  ```

- [ ] User :

  ```
  Claude, utilise task-creator pour importer les tâches du transcript brainstorm-2026-01-05.md
  ```

- [ ] Claude Code :
  1. Lit `.claude/task-creator.md`
  2. Lit `transcripts/brainstorm-2026-01-05.md`
  3. Parse tâches
  4. Génère commandes
  5. Demande validation
  6. Exécute via Bash tool

**Tests :**

- [ ] Test parsing transcript → tâches extraites
- [ ] Test génération commandes CLI → syntaxe correcte
- [ ] Test exécution → tâches créées dans DevFlow

---

## Critères de Succès

- [ ] CLI DevFlow compilée et distribuable (binaire Rust)
- [ ] Commandes auth fonctionnelles (login, logout, whoami)
- [ ] Commandes tasks fonctionnelles (add, list, show, update, delete)
- [ ] API endpoints CLI créés et testés
- [ ] Workspace Claude Code configuré
- [ ] Flow complet Voice → Transcript → CLI testé
- [ ] Binaires disponibles pour Linux, macOS, Windows
- [ ] Prêt pour Phase 8 (DevFlow AI)

---

## Avantages du passage à Rust

1. **Performance** : Binaire natif, démarrage instantané (< 10ms vs ~500ms Node.js)
2. **Distribution** : Single binary, pas de runtime nécessaire
3. **Fiabilité** : Typage fort, pas d'erreurs runtime
4. **Cross-platform** : Compilation native pour Linux, macOS, Windows
5. **Taille** : Binaire compact (~5-10MB vs ~100MB+ Node.js avec node_modules)

---

## Migration de l'ancien scaffolding TypeScript

Le dossier `cli/` existant contient du scaffolding TypeScript qui doit être supprimé :

- [ ] Supprimer `cli/` directory (TypeScript scaffolding)
- [ ] Créer nouveau projet `devflow-cli/` (Rust)
- [ ] Mettre à jour les références dans la documentation

---

## Risques

**Risque 1 : Parsing transcript imprécis**

- **Impact :** Tâches mal créées
- **Mitigation :** Toujours valider avec user avant exécution

**Risque 2 : Cross-compilation complexe**

- **Impact :** Builds échoués sur certaines plateformes
- **Mitigation :** Utiliser GitHub Actions avec matrices de build testées

**Risque 3 : API rate limiting**

- **Impact :** CLI bloqué
- **Mitigation :** Ajouter retry logic avec backoff exponentiel

---

## Notes

- CLI doit être rapide (< 50ms par commande grâce à Rust)
- Output CLI coloré (colored crate) pour UX
- Workspace task-creator réutilisable pour autres use cases
- Installation simple : télécharger binaire ou `cargo install`

---

**Prochaine phase :** Phase 8 - DevFlow AI Proactive
