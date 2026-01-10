#!/usr/bin/env node

/**
 * DevFlow CLI
 *
 * Quick command-line interface for DevFlow:
 * - devflow add <task> - Add task to backlog
 * - devflow start - Start timer
 * - devflow status - Show today's overview
 *
 * @todo Phase 7: Implement CLI commands
 */

/* eslint-disable no-console */
import { Command } from "commander";

const program = new Command();

program
  .name("devflow")
  .description("DevFlow CLI - Productivity system for 10x developers")
  .version("0.1.0");

program
  .command("add")
  .description("Add a task to backlog")
  .argument("<task>", "Task description")
  .action((task: string) => {
    console.log(`TODO: Add task: ${task}`);
  });

program
  .command("start")
  .description("Start focus timer")
  .action(() => {
    console.log("TODO: Start timer");
  });

program
  .command("status")
  .description("Show today's overview")
  .action(() => {
    console.log("TODO: Show status");
  });

program.parse();
