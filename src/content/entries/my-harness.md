---
title: My Agent Harness
description: Notes about the evolution and changes of my agent harness
publishedAt: 2026-11-24
category: ai
kind: note
status: raw
tags: [learning, ai, harness, observational-memory, pi]
draft: false
---

# My Agent Harness (so far)

There are a lot of templates for agent harnesses online. From coding harnesses, to game dev harnesses, hacking harnesses and so on. If you want to do something with AI, there's likely a harness for you somewhere. So here is mine.

My harness is sort of a duck. It wasn't built to do anything particularly well, but it helps with pretty much everything I study. It is not aimed at full automation of anything, nor is it a guide. It is more of a collaborative effort for me and my buds (that's what I tend to call my AI assistants).

## Pi

Though I use a different set of tools at work, for my personal projects, studies and certifications I tend to use [Pi](https://pi.dev/). It is a minimalistic AI assistant that doesn't come with a lot of built-in stuff. It works autonomously by default, supports skills out of the box, and it has a lot of community plugins. The idea behind Pi is having a minimal working harness that you add stuff to as you need. My only problem with Pi is that I'm not very good at TypeScript, but even so I can write an extension or two as it has a very simple framework for extensions. Take a look for yourself: [Extensions - Pi](https://docs.pi.dev/latest/extensions)

### Providers

I'm an offensive security analyst by profession, so my harness has to be usable for red team activities, which is hard (but not impossible) with frontier models. Anthropic and OpenAI have Cyber Verification Programs, but they're only available for enterprise-level users. There are ways to use these models more offensively, but these risk a ban on your account, so I'd steer clear of that.

I recommend going with other inference providers. My favorites are:

- [**OpenCode Go**](https://opencode.ai/console/go): it has a $10 plan with some very generous limits if you're not going to use it for heavy automation.
- [**Command Code**](https://commandcode.ai/): it also has a $10 plan, but it has a $1 plan for you to experiment with the models. Though this one is not supported out of the box for Pi, there are community extensions for it.
- [**OpenRouter**](https://openrouter.ai/): I think it's even more famous than OpenCode Go and it is the community's go-to for open-weight models.
- [**Ollama Pro**](https://ollama.com/pricing): I've used Ollama Pro for a while, and it has some amazing community models. I haven't tested a lot of them, but it is usually simpler to have an uncensored or fine-tuned model write exploits for you.

For my development activities I have more traditional providers.

- **ChatGPT Plus**: I really like this one, though I'm not a big fan of Codex. Pi supports authentication with your ChatGPT Plus account out of the box, and thanks to it, you can use other capabilities provided by GPT models, like image generation and web search.
- **Antigravity**: I like Antigravity for developing stuff, especially Pi extensions. But it has never been my favorite harness. It also can give your Pi Gemini model capabilities. But I use it to work with frontend and design stuff, it is very good at it and gets even better with Anthropic's [frontend design skill](https://agenticskills.io/skills/frontend-design).
- **Claude Code**: Claude Code is a general-purpose tool. If you don't know which one to get or can only pick one, pick this one.

The combination I'm currently using is: Command Code + OpenRouter (I use it for Jev and automations) + ChatGPT Plus + Antigravity.

### Extensions

As I've mentioned before, Pi is supposed to be used with extensions. And, as of now, I use a few of them. Most of them you can find on Pi's [package store](https://pi.dev/packages). Mine are:

- [pi-ask-user-question](https://pi.dev/packages/pi-ask-user-question): for some reason Pi can't make those fancy question boxes like Antigravity and Claude can. This extension fixes it.
- [pi-subagents](https://pi.dev/packages/@tintinweb/pi-subagents): also an approximation of a Claude Code capability. This extension allows Pi to spawn subagents and adds a fleet view very similar to that of Claude Code.
- [pi-commandcode-provider](https://pi.dev/packages/pi-commandcode-provider): this extension allows Pi to use Command Code (the provider I mentioned earlier) as a provider. If you're using a different provider you don't need this one.
- [pi-web-search](https://pi.dev/packages/pi-web-search): this one is awesome. It gives your Pi the ability to search the web using your underlying model's capabilities. If you're using a ChatGPT Plus account, Gemini models, Anthropic's API... if the model has the capability to search the web, you should use this tool. There are also extensions for other capabilities of underlying models, like image generation.
- [pi-observational-memory](https://pi.dev/packages/pi-observational-memory): This one is definitely one of my favorites. It adapts [Mastra's Observational Memory](https://mastra.ai/docs/memory/observational-memory) to Pi. It is a different approach to context management than chat summarization after a certain threshold. It keeps watching your conversation and, after some time, an agent runs in the background to analyze what has been talked about and extract important observations. These observations are then prepended to your new messages, so you never have to stop a session to summarize a chat that got too long. Thanks to this (and a workaround to adapt it to Claude Code) you can have long sessions in a single chat.
- [pi-acp-provider](https://pi.dev/packages/pi-acp-provider): I didn't know the [Agent Client Protocol](https://agentclientprotocol.com/get-started/introduction) existed until I found this extension. It allows you to have harnesses that support Zed's ACP as providers in your Pi. Antigravity can be run over ACP by using `agy acp`. There are also adapters for Codex and Claude Code that let you use them over ACP. I use this extension, actually a fork of it, to have Pi be the coordinator of the other harnesses I have on my machine.

## Memory

As I've mentioned over Pi's extensions, I use observational memory as my main memory management system. It is less lossy than chat summarization for sure, but it can still lose some context over time. Because of this I also use a MEMORY.md file in the root of my project, especially in red team engagements and offensive security laboratories. What I usually do is use this MEMORY.md file to hold smaller temporary snippets of memory and an index to more permanent memory files that are usually stored in the project's `.pi/memory/` directory.

I've been meaning to build a RAG for memory management and cross-project learning, but this setup seems to be working so well I don't see myself changing from it any time soon.

## Tmux

I think everybody uses a terminal multiplexer, but I think I should mention it as well. Sometimes it's easier for you to do some stuff alongside your agent by watching what they're doing in real time. In red team engagements, especially OSAI, which I'm taking right now, I usually have to connect manually to remote hosts via SSH. I feel more comfortable opening a new tmux window, connecting there, and then letting my agent use it alongside me, than giving them a dedicated SSH session.

One important thing to configure when using Pi with tmux is to use extended keys and vim-style navigation. To do that just add the lines below to your `~/.tmux.conf`:

```
set -g mode-keys vi
set -g extended-keys on
set -g extended-keys-format csi-u
```
