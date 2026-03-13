export interface Agent_Team {
    provider: string;
    component_type: string;
    version: number;
    component_version: number;
    description: string;
    label: string;
    config: Agent_Team_Config;
}


export interface Agent_Team_Config {
    participants: Agent[];
    termination_condition: TerminationCondition;
    max_turns: number;
    emit_team_events: boolean;
}

export interface Agent {
    provider: string;
    component_type: string;
    version: number;
    component_version: number;
    description: string;
    label: string;
    config: Agent_Config;
}

export interface Agent_Config {
    name: string;
    system_message: string;
    description: string;
    model_client_stream: boolean;
    reflect_on_tool_use: boolean;
    tool_call_summary_format: string;
    metadata: Record<string, any>;
    model_client: ModelClient;
    workbench: Workbench[];
    model_context: ModelContext;
    tools: Tool[];
}

export interface ModelClient {
    provider: string;
    component_type: string;
    version: number;
    component_version: number;
    description: string;
    label: string;
    config: ModelClient_Config;
}

export interface ModelClient_Config {
    model?: string;
    api_key?: string | null;
    base_url?: string | null;
    model_info?: ModelInfo | null;
    max_tokens?: number | null;
    temperature?: number | null;
}

export interface ModelInfo {
    vision: boolean;
    function_calling: boolean;
    json_output: boolean;
    family: string;
    structured_output: boolean;
    multiple_system_messages: boolean;
}


export interface Workbench {
    provider: string;
    component_type: string;
    version: number;
    component_version: number;
    description: string;
    label: string;
    config: Workbench_Config;
}

export interface Workbench_Config {
    tools: Workbench_Config_Tool[];
}

export interface Workbench_Config_Tool {
    provider: string;
    component_type: string;
    version: number;
    component_version: number;
    description: string;
    label: string;
    config: Workbench_Config_Tool_Config;
}




export interface Workbench_Config_Tool_Config {
    source_code: string;
    name: string;
    description: string;
    global_imports: (string | { module: string; imports: string[] })[];
    has_cancellation_support: boolean;
}


export interface ModelContext {
    provider: string;
    component_type: string;
    version: number;
    component_version: number;
    description: string;
    label: string;
    config: ModelContext_Config;
}

export interface ModelContext_Config {

}



export interface Tool {
    provider: string;
    component_type: string;
    version: number;
    component_version: number;
    description: string;
    label: string;
    config: Tool_Config;
}

export interface Tool_Config {
    source_code: string;
    name: string;
    description: string;
    global_imports: (string | { module: string; imports: string[] })[];
    has_cancellation_support: boolean;
}



export interface TerminationCondition {
    provider: string;
    component_type: string;
    version: number;
    component_version: number;
    description: string;
    label: string;
    config: TerminationCondition_Config;
}

export interface TerminationCondition_Config {
    text: string;
}

export const rawData: Agent_Team = {
    provider: "",
    component_type: "",
    version: 0,
    component_version: 0,
    description: "",
    label: "",
    config: {
        participants: [],
        termination_condition: {
            provider: "",
            component_type: "",
            version: 0,
            component_version: 0,
            description: "",
            label: "",
            config: {
                text: ""
            }
        },
        max_turns: 0,
        emit_team_events: false
    }
}


/*
export const rawData: Agent_Team =
{
    "provider": "autogen_agentchat.teams.RoundRobinGroupChat",
    "component_type": "team",
    "version": 1,
    "component_version": 1,
    "description": "A team that runs a group chat with participants taking turns in a round-robin fashion to publish a message to all.",
    "label": "RoundRobinGroupChat",
    "config": {
        "participants": [
            {
                "provider": "autogen_agentchat.agents.AssistantAgent",
                "component_type": "agent",
                "version": 2,
                "component_version": 2,
                "description": "An agent that provides assistance with tool use.",
                "label": "AssistantAgent",
                "config": {
                    "name": "Planner_Agent",
                    "system_message": "You are responsible for creating a structured outline for the blog post. Take the user's topic and generate a clear, concise bullet-point outline. Pass this outline to the Writer_Agent without adding any additional commentary.",
                    "description": "An agent that provides assistance with ability to use tools.",
                    "model_client_stream": false,
                    "reflect_on_tool_use": false,
                    "tool_call_summary_format": "{result}",
                    "metadata": {},
                    "model_client": {
                        "provider": "autogen_ext.models.openai.OpenAIChatCompletionClient",
                        "component_type": "model",
                        "version": 1,
                        "component_version": 1,
                        "description": "OpenAI GPT-4o-mini",
                        "label": "OpenAI GPT-4o Mini",
                        "config": {
                            "model": "gpt-4o-mini"
                        }
                    },
                    "workbench": [
                        {
                            "provider": "autogen_core.tools.StaticWorkbench",
                            "component_type": "workbench",
                            "version": 1,
                            "component_version": 1,
                            "description": "A workbench that provides a static set of tools that do not change after each tool execution.",
                            "label": "StaticWorkbench",
                            "config": {
                                "tools": []
                            }
                        }
                    ],
                    "model_context": {
                        "provider": "autogen_core.model_context.UnboundedChatCompletionContext",
                        "component_type": "chat_completion_context",
                        "version": 1,
                        "component_version": 1,
                        "description": "An unbounded chat completion context that keeps a view of the all the messages.",
                        "label": "UnboundedChatCompletionContext",
                        "config": {}
                    },
                    "tools": [
                        {
                            "provider": "autogen_core.tools.FunctionTool",
                            "component_type": "tool",
                            "version": 1,
                            "component_version": 1,
                            "description": "A tool that performs basic arithmetic operations (addition, subtraction, multiplication, division).",
                            "label": "Calculator Tool",
                            "config": {
                                "source_code": "def calculator(a: float, b: float, operator: str) -> str:\n    try:\n        if operator == \"+\":\n            return str(a + b)\n        elif operator == \"-\":\n            return str(a - b)\n        elif operator == \"*\":\n            return str(a * b)\n        elif operator == \"/\":\n            if b == 0:\n                return \"Error: Division by zero\"\n            return str(a / b)\n        else:\n            return \"Error: Invalid operator. Please use +, -, *, or /\"\n    except Exception as e:\n        return f\"Error: {str(e)}\"\n",
                                "name": "calculator",
                                "description": "A simple calculator that performs basic arithmetic operations",
                                "global_imports": [],
                                "has_cancellation_support": false
                            }
                        }
                    ]
                }
            },
            {
                "provider": "autogen_agentchat.agents.AssistantAgent",
                "component_type": "agent",
                "version": 2,
                "component_version": 2,
                "description": "An agent that provides assistance with tool use.",
                "label": "AssistantAgent",
                "config": {
                    "name": "Writer_Agent",
                    "system_message": "You are the content creator. Take the bullet-point outline from the Planner_Agent and write a short, engaging two-paragraph blog post based on it. Ensure the post is clear and follows the outline closely. Pass the completed post to the Reviewer_Agent.",
                    "description": "An agent that provides assistance with ability to use tools.",
                    "model_client_stream": false,
                    "reflect_on_tool_use": false,
                    "tool_call_summary_format": "{result}",
                    "metadata": {},
                    "model_client": {
                        "provider": "autogen_ext.models.anthropic.AnthropicChatCompletionClient",
                        "component_type": "model",
                        "version": 1,
                        "component_version": 1,
                        "description": "Anthropic Claude-3 model client.",
                        "label": "Anthropic Claude-3-7",
                        "config": {
                            "model": "claude-3-7-sonnet-20250219",
                            "max_tokens": 4096,
                            "temperature": 1
                        }
                    },
                    "workbench": [
                        {
                            "provider": "autogen_core.tools.StaticWorkbench",
                            "component_type": "workbench",
                            "version": 1,
                            "component_version": 1,
                            "description": "A workbench that provides a static set of tools that do not change after each tool execution.",
                            "label": "StaticWorkbench",
                            "config": {
                                "tools": []
                            }
                        }
                    ],
                    "model_context": {
                        "provider": "autogen_core.model_context.UnboundedChatCompletionContext",
                        "component_type": "chat_completion_context",
                        "version": 1,
                        "component_version": 1,
                        "description": "An unbounded chat completion context that keeps a view of the all the messages.",
                        "label": "UnboundedChatCompletionContext",
                        "config": {}
                    },
                    "tools": [
                        {
                            "provider": "autogen_core.tools.FunctionTool",
                            "component_type": "tool",
                            "version": 1,
                            "component_version": 1,
                            "description": "A tool that generates images based on a text description using OpenAI's DALL-E model. Note: Requires OpenAI API key to function.",
                            "label": "Image Generation Tool",
                            "config": {
                                "source_code": "async def generate_image(\n    query: str, output_dir: Optional[Path] = None, image_size: Literal[\"1024x1024\", \"512x512\", \"256x256\"] = \"1024x1024\"\n) -> List[str]:\n    \"\"\"\n    Generate images using OpenAI's DALL-E model based on a text description.\n\n    Args:\n        query: Natural language description of the desired image\n        output_dir: Directory to save generated images (default: current directory)\n        image_size: Size of generated image (1024x1024, 512x512, or 256x256)\n\n    Returns:\n        List[str]: Paths to the generated image files\n    \"\"\"\n    # Initialize the OpenAI client\n    client = OpenAI()\n\n    # Generate images using DALL-E 3\n    response = client.images.generate(model=\"dall-e-3\", prompt=query, n=1, response_format=\"b64_json\", size=image_size)\n\n    saved_files = []\n\n    # Process the response\n    if response.data:\n        for image_data in response.data:\n            # Generate a unique filename\n            file_name: str = f\"{uuid.uuid4()}.png\"\n\n            # Use output_dir if provided, otherwise use current directory\n            file_path = Path(output_dir) / file_name if output_dir else Path(file_name)\n\n            base64_str = image_data.b64_json\n            if base64_str:\n                img = Image.open(io.BytesIO(base64.decodebytes(bytes(base64_str, \"utf-8\"))))\n                # Save the image to a file\n                img.save(file_path)\n                saved_files.append(str(file_path))\n\n    return saved_files\n",
                                "name": "generate_image",
                                "description": "Generate images using DALL-E based on text descriptions.",
                                "global_imports": [
                                    "io",
                                    "uuid",
                                    "base64",
                                    {
                                        "module": "typing",
                                        "imports": [
                                            "List",
                                            "Optional",
                                            "Literal"
                                        ]
                                    },
                                    {
                                        "module": "pathlib",
                                        "imports": [
                                            "Path"
                                        ]
                                    },
                                    {
                                        "module": "openai",
                                        "imports": [
                                            "OpenAI"
                                        ]
                                    },
                                    {
                                        "module": "PIL",
                                        "imports": [
                                            "Image"
                                        ]
                                    }
                                ],
                                "has_cancellation_support": false
                            }
                        }
                    ]
                }
            },
            {
                "provider": "autogen_agentchat.agents.AssistantAgent",
                "component_type": "agent",
                "version": 2,
                "component_version": 2,
                "description": "An agent that provides assistance with tool use.",
                "label": "AssistantAgent",
                "config": {
                    "name": "Reviewer_Agent",
                    "system_message": "You are the quality checker. Review the blog post from the Writer_Agent. If the post meets the required standards and is ready for publication, respond with only the word 'PUBLISH'. Do not provide any additional feedback or commentary.",
                    "description": "An agent that provides assistance with ability to use tools.",
                    "model_client_stream": false,
                    "reflect_on_tool_use": false,
                    "tool_call_summary_format": "{result}",
                    "metadata": {},
                    "model_client": {
                        "provider": "autogen_ext.models.openai.OpenAIChatCompletionClient",
                        "component_type": "model",
                        "version": 1,
                        "component_version": 1,
                        "description": "Chat completion client for OpenAI hosted models.",
                        "label": "OpenAIChatCompletionClient",
                        "config": {
                            "model": "deepseek-v3-250324",
                            "api_key": "e12dc278-b410-40a8-b863-05c9dcae4cd3",
                            "base_url": "https://ark.cn-beijing.volces.com/api/v3",
                            "model_info": {
                                "vision": false,
                                "function_calling": true,
                                "json_output": true,
                                "family": "unknown",
                                "structured_output": true,
                                "multiple_system_messages": true
                            }
                        }
                    },
                    "workbench": [
                        {
                            "provider": "autogen_core.tools.StaticWorkbench",
                            "component_type": "workbench",
                            "version": 1,
                            "component_version": 1,
                            "description": "A workbench that provides a static set of tools that do not change after each tool execution.",
                            "label": "StaticWorkbench",
                            "config": {
                                "tools": []
                            }
                        }
                    ],
                    "model_context": {
                        "provider": "autogen_core.model_context.UnboundedChatCompletionContext",
                        "component_type": "chat_completion_context",
                        "version": 1,
                        "component_version": 1,
                        "description": "An unbounded chat completion context that keeps a view of the all the messages.",
                        "label": "UnboundedChatCompletionContext",
                        "config": {}
                    },
                    "tools": [
                        {
                            "provider": "autogen_core.tools.FunctionTool",
                            "component_type": "tool",
                            "version": 1,
                            "component_version": 1,
                            "description": "A tool that performs Bing searches using the Bing Web Search API. Requires the requests library, BING_SEARCH_KEY env variable to function.",
                            "label": "Bing Search Tool",
                            "config": {
                                "source_code": "async def bing_search(\n    query: str,\n    num_results: int = 3,\n    include_snippets: bool = True,\n    include_content: bool = True,\n    content_max_length: Optional[int] = 10000,\n    language: str = \"en\",\n    country: Optional[str] = None,\n    safe_search: str = \"moderate\",\n    response_filter: str = \"webpages\",\n) -> List[Dict[str, str]]:\n    \"\"\"\n    Perform a Bing search using the Bing Web Search API.\n\n    Args:\n        query: Search query string\n        num_results: Number of results to return (max 50)\n        include_snippets: Include result snippets in output\n        include_content: Include full webpage content in markdown format\n        content_max_length: Maximum length of webpage content (if included)\n        language: Language code for search results (e.g., 'en', 'es', 'fr')\n        country: Optional market code for search results (e.g., 'us', 'uk')\n        safe_search: SafeSearch setting ('off', 'moderate', or 'strict')\n        response_filter: Type of results ('webpages', 'news', 'images', or 'videos')\n\n    Returns:\n        List[Dict[str, str]]: List of search results\n\n    Raises:\n        ValueError: If API credentials are invalid or request fails\n    \"\"\"\n    # Get and validate API key\n    api_key = os.getenv(\"BING_SEARCH_KEY\", \"\").strip()\n\n    if not api_key:\n        raise ValueError(\n            \"BING_SEARCH_KEY environment variable is not set. \" \"Please obtain an API key from Azure Portal.\"\n        )\n\n    # Validate safe_search parameter\n    valid_safe_search = [\"off\", \"moderate\", \"strict\"]\n    if safe_search.lower() not in valid_safe_search:\n        raise ValueError(f\"Invalid safe_search value. Must be one of: {', '.join(valid_safe_search)}\")\n\n    # Validate response_filter parameter\n    valid_filters = [\"webpages\", \"news\", \"images\", \"videos\"]\n    if response_filter.lower() not in valid_filters:\n        raise ValueError(f\"Invalid response_filter value. Must be one of: {', '.join(valid_filters)}\")\n\n    async def fetch_page_content(url: str, max_length: Optional[int] = 50000) -> str:\n        \"\"\"Helper function to fetch and convert webpage content to markdown\"\"\"\n        headers = {\"User-Agent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36\"}\n\n        try:\n            async with httpx.AsyncClient() as client:\n                response = await client.get(url, headers=headers, timeout=10)\n                response.raise_for_status()\n\n                soup = BeautifulSoup(response.text, \"html.parser\")\n\n                # Remove script and style elements\n                for script in soup([\"script\", \"style\"]):\n                    script.decompose()\n\n                # Convert relative URLs to absolute\n                for tag in soup.find_all([\"a\", \"img\"]):\n                    if tag.get(\"href\"):\n                        tag[\"href\"] = urljoin(url, tag[\"href\"])\n                    if tag.get(\"src\"):\n                        tag[\"src\"] = urljoin(url, tag[\"src\"])\n\n                h2t = html2text.HTML2Text()\n                h2t.body_width = 0\n                h2t.ignore_images = False\n                h2t.ignore_emphasis = False\n                h2t.ignore_links = False\n                h2t.ignore_tables = False\n\n                markdown = h2t.handle(str(soup))\n\n                if max_length and len(markdown) > max_length:\n                    markdown = markdown[:max_length] + \"\\n...(truncated)\"\n\n                return markdown.strip()\n\n        except Exception as e:\n            return f\"Error fetching content: {str(e)}\"\n\n    # Build request headers and parameters\n    headers = {\"Ocp-Apim-Subscription-Key\": api_key, \"Accept\": \"application/json\"}\n\n    params = {\n        \"q\": query,\n        \"count\": min(max(1, num_results), 50),\n        \"mkt\": f\"{language}-{country.upper()}\" if country else language,\n        \"safeSearch\": safe_search.capitalize(),\n        \"responseFilter\": response_filter,\n        \"textFormat\": \"raw\",\n    }\n\n    # Make the request\n    try:\n        async with httpx.AsyncClient() as client:\n            response = await client.get(\n                \"https://api.bing.microsoft.com/v7.0/search\", headers=headers, params=params, timeout=10\n            )\n\n            # Handle common error cases\n            if response.status_code == 401:\n                raise ValueError(\"Authentication failed. Please verify your Bing Search API key.\")\n            elif response.status_code == 403:\n                raise ValueError(\n                    \"Access forbidden. This could mean:\\n\"\n                    \"1. The API key is invalid\\n\"\n                    \"2. The API key has expired\\n\"\n                    \"3. You've exceeded your API quota\"\n                )\n            elif response.status_code == 429:\n                raise ValueError(\"API quota exceeded. Please try again later.\")\n\n            response.raise_for_status()\n            data = response.json()\n\n        # Process results based on response_filter\n        results = []\n        if response_filter == \"webpages\" and \"webPages\" in data:\n            items = data[\"webPages\"][\"value\"]\n        elif response_filter == \"news\" and \"news\" in data:\n            items = data[\"news\"][\"value\"]\n        elif response_filter == \"images\" and \"images\" in data:\n            items = data[\"images\"][\"value\"]\n        elif response_filter == \"videos\" and \"videos\" in data:\n            items = data[\"videos\"][\"value\"]\n        else:\n            if not any(key in data for key in [\"webPages\", \"news\", \"images\", \"videos\"]):\n                return []  # No results found\n            raise ValueError(f\"No {response_filter} results found in API response\")\n\n        # Extract relevant information based on result type\n        for item in items:\n            result = {\"title\": item.get(\"name\", \"\")}\n\n            if response_filter == \"webpages\":\n                result[\"link\"] = item.get(\"url\", \"\")\n                if include_snippets:\n                    result[\"snippet\"] = item.get(\"snippet\", \"\")\n                if include_content:\n                    result[\"content\"] = await fetch_page_content(result[\"link\"], max_length=content_max_length)\n\n            elif response_filter == \"news\":\n                result[\"link\"] = item.get(\"url\", \"\")\n                if include_snippets:\n                    result[\"snippet\"] = item.get(\"description\", \"\")\n                result[\"date\"] = item.get(\"datePublished\", \"\")\n                if include_content:\n                    result[\"content\"] = await fetch_page_content(result[\"link\"], max_length=content_max_length)\n\n            elif response_filter == \"images\":\n                result[\"link\"] = item.get(\"contentUrl\", \"\")\n                result[\"thumbnail\"] = item.get(\"thumbnailUrl\", \"\")\n                if include_snippets:\n                    result[\"snippet\"] = item.get(\"description\", \"\")\n\n            elif response_filter == \"videos\":\n                result[\"link\"] = item.get(\"contentUrl\", \"\")\n                result[\"thumbnail\"] = item.get(\"thumbnailUrl\", \"\")\n                if include_snippets:\n                    result[\"snippet\"] = item.get(\"description\", \"\")\n                result[\"duration\"] = item.get(\"duration\", \"\")\n\n            results.append(result)\n\n        return results[:num_results]\n\n    except httpx.HTTPError as e:\n        error_msg = str(e)\n        if \"InvalidApiKey\" in error_msg:\n            raise ValueError(\"Invalid API key. Please check your BING_SEARCH_KEY environment variable.\") from e\n        elif \"KeyExpired\" in error_msg:\n            raise ValueError(\"API key has expired. Please generate a new key.\") from e\n        else:\n            raise ValueError(f\"Search request failed: {error_msg}\") from e\n    except json.JSONDecodeError:\n        raise ValueError(\"Failed to parse API response. \" \"Please verify your API credentials and try again.\") from None\n    except Exception as e:\n        raise ValueError(f\"Unexpected error during search: {str(e)}\") from e\n",
                                "name": "bing_search",
                                "description": "\n    Perform Bing searches using the Bing Web Search API. Requires BING_SEARCH_KEY environment variable.\n    Supports web, news, image, and video searches.\n    See function documentation for detailed setup instructions.\n    ",
                                "global_imports": [
                                    {
                                        "module": "typing",
                                        "imports": [
                                            "List",
                                            "Dict",
                                            "Optional"
                                        ]
                                    },
                                    "os",
                                    "httpx",
                                    "json",
                                    "html2text",
                                    {
                                        "module": "bs4",
                                        "imports": [
                                            "BeautifulSoup"
                                        ]
                                    },
                                    {
                                        "module": "urllib.parse",
                                        "imports": [
                                            "urljoin"
                                        ]
                                    }
                                ],
                                "has_cancellation_support": false
                            }
                        }
                    ]
                }
            }
        ],
        "termination_condition": {
            "provider": "autogen_agentchat.conditions.TextMentionTermination",
            "component_type": "termination",
            "version": 1,
            "component_version": 1,
            "description": "Terminate the conversation if a specific text is mentioned.",
            "label": "TextMentionTermination",
            "config": {
                "text": "TERMINATE"
            }
        },
        "max_turns": 4,
        "emit_team_events": false
    }
}

*/