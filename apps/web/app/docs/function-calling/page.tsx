"use client";

import { motion } from "framer-motion";
import {
  Wrench,
  Code2,
  Braces,
  ArrowRight,
  Zap,
  ListChecks,
} from "lucide-react";
import { Section } from "@/components/docs/Section";
import { DocsSubhead } from "@/components/docs/DocsCard";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { TipBox } from "@/components/docs/TipBox";

import { getDocsBaseUrl } from "@/lib/docs-config";

const BASE_URL = getDocsBaseUrl();

export default function FunctionCallingPage() {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.06 } },
      }}
    >
      <Section
        id="function-calling"
        icon={Wrench}
        eyebrow="Advanced"
        title="Function Calling"
        italic="& Tools"
        description="Give models the ability to call external functions. Define tools with JSON Schema, send them with your request, and handle the model's tool calls in your application. Works with both OpenAI and Anthropic formats."
      >
        {/* Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
          {[
            {
              icon: Braces,
              title: "JSON Schema definitions",
              desc: "Define tools using standard JSON Schema. The model sees the schema and decides when to call each function.",
            },
            {
              icon: ListChecks,
              title: "Parallel tool calls",
              desc: "Models can request multiple tool calls in a single response. Execute them all and return results together.",
            },
            {
              icon: ArrowRight,
              title: "Multi-turn workflows",
              desc: "Tool calls create a natural conversation loop: model requests a tool, you execute it and return the result, model continues.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="p-5 rounded-xl border border-white/[0.07] bg-gradient-to-br from-white/[0.02] to-transparent"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-500/[0.08] border border-indigo-500/15 flex items-center justify-center mb-3">
                <feature.icon className="w-4 h-4 text-indigo-200" />
              </div>
              <h4 className="text-sm font-semibold text-white/85 mb-1">
                {feature.title}
              </h4>
              <p className="text-xs text-white/40 leading-[1.6]">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>

        {/* OpenAI format */}
        <div className="mt-14">
          <DocsSubhead>
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
            OpenAI format
          </DocsSubhead>
          <p className="text-sm text-white/55 leading-[1.75] mb-5">
            Use the{" "}
            <code className="px-1.5 py-0.5 rounded-md bg-white/[0.04] text-white/70 font-mono text-[13px]">
              tools
            </code>{" "}
            parameter with the OpenAI-compatible endpoint. Define your functions
            and let the model decide when to call them.
          </p>
          <CodeBlock
            language="python"
            code={`import requests

res = requests.post(
    f"${BASE_URL}/v1/chat/completions",
    headers={
        "Content-Type": "application/json",
        "Authorization": "Bearer YOUR_API_KEY",
    },
    json={
        "model": "openai/gpt-4o",
        "messages": [
            {"role": "user", "content": "What's the weather in Tokyo?"}
        ],
        "tools": [{
            "type": "function",
            "function": {
                "name": "get_weather",
                "description": "Get current weather for a location",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "location": {
                            "type": "string",
                            "description": "City name, e.g. Tokyo"
                        },
                        "unit": {
                            "type": "string",
                            "enum": ["celsius", "fahrenheit"]
                        }
                    },
                    "required": ["location"]
                }
            }
        }]
    },
)

data = res.json()
choice = data["choices"][0]

if choice["finish_reason"] == "tool_calls":
    for tool_call in choice["message"]["tool_calls"]:
        print(f"Function: {tool_call['function']['name']}")
        print(f"Arguments: {tool_call['function']['arguments']}")`}
          />
        </div>

        {/* Returning tool results */}
        <div className="mt-14">
          <DocsSubhead>Returning tool results</DocsSubhead>
          <p className="text-sm text-white/55 leading-[1.75] mb-5">
            After executing the function, pass the result back to the model by
            appending a tool message to the conversation. The model will use the
            result to formulate its final response.
          </p>
          <CodeBlock
            language="javascript"
            code={`const response = await fetch("${BASE_URL}/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_API_KEY",
  },
  body: JSON.stringify({
    model: "openai/gpt-4o",
    messages: [
      { role: "user", content: "What's the weather in Tokyo?" },
      {
        role: "assistant",
        tool_calls: [{
          id: "call_abc123",
          type: "function",
          function: {
            name: "get_weather",
            arguments: '{"location":"Tokyo","unit":"celsius"}'
          }
        }]
      },
      {
        role: "tool",
        tool_call_id: "call_abc123",
        content: JSON.stringify({ temp: 22, condition: "Sunny" })
      }
    ],
    tools: [/* same tool definitions */],
  }),
});

const data = await response.json();
// The model now has the weather data and can respond naturally
console.log(data.choices[0].message.content);
// "The current weather in Tokyo is 22°C and sunny."`}
          />
        </div>

        {/* Anthropic format */}
        <div className="mt-14">
          <DocsSubhead>
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(196,181,253,0.6)]" />
            Anthropic format
          </DocsSubhead>
          <p className="text-sm text-white/55 leading-[1.75] mb-5">
            The Anthropic Messages API uses a slightly different tool format.
            The gateway handles translation between formats automatically when
            you route across providers.
          </p>
          <CodeBlock
            language="python"
            code={`from anthropic import Anthropic

client = Anthropic(
    base_url="${BASE_URL}",
    api_key="YOUR_YAPAPA_API_KEY",
)

message = client.messages.create(
    model="anthropic/claude-sonnet-4",
    max_tokens=1024,
    tools=[{
        "name": "get_weather",
        "description": "Get current weather for a location",
        "input_schema": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": "City name"
                }
            },
            "required": ["location"]
        }
    }],
    messages=[{"role": "user", "content": "What's the weather in Paris?"}],
)

# Handle tool use
if message.stop_reason == "tool_use":
    for block in message.content:
        if block.type == "tool_use":
            print(f"Tool: {block.name}")
            print(f"Input: {block.input}")
            # Execute the function and return the result...`}
          />
        </div>

        {/* Web search tool */}
        <div className="mt-14">
          <DocsSubhead>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
            Built-in: Web search tool
          </DocsSubhead>
          <p className="text-sm text-white/55 leading-[1.75] mb-5">
            Yapapa includes a built-in web search tool under{" "}
            <code className="px-1.5 py-0.5 rounded-md bg-white/[0.04] text-white/70 font-mono text-[13px]">
              pkg/llm/tools/websearch/
            </code>
            . Enable it in the request to let models search the web for
            up-to-date information.
          </p>
          <CodeBlock
            language="json"
            code={`{
  "model": "openai/gpt-4o",
  "messages": [
    {"role": "user", "content": "What happened in the news today?"}
  ],
  "tools": [{
    "type": "function",
    "function": {
      "name": "web_search",
      "description": "Search the web for current information",
      "parameters": {
        "type": "object",
        "properties": {
          "query": {"type": "string", "description": "Search query"}
        },
        "required": ["query"]
      }
    }
  }]
}`}
          />
        </div>

        {/* Best practices */}
        <div className="mt-14">
          <DocsSubhead>Best practices</DocsSubhead>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                title: "Clear descriptions",
                desc: "Write detailed function and parameter descriptions. The model relies on these to decide when and how to call tools.",
              },
              {
                title: "Strict schemas",
                desc: "Use required fields, enums, and type constraints. Strict schemas reduce hallucinated arguments and invalid calls.",
              },
              {
                title: "Limit tool count",
                desc: "Keep tools to 10 or fewer per request. More tools increase latency and reduce accuracy as the model must evaluate each one.",
              },
              {
                title: "Idempotent functions",
                desc: "Design tool functions to be idempotent when possible. Models may retry calls on failure, so duplicate calls should be safe.",
              },
            ].map((practice) => (
              <div
                key={practice.title}
                className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.07]"
              >
                <h4 className="text-white/90 font-semibold text-xs mb-1.5">
                  {practice.title}
                </h4>
                <p className="text-xs text-white/40 leading-[1.6]">
                  {practice.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        <TipBox>
          Tool calls are billed the same as regular chat completions — the input
          includes the tool definitions and output includes the tool call JSON.
          Keep tool schemas concise to minimize token usage.
        </TipBox>
      </Section>
    </motion.div>
  );
}
