//这里存放可视化节点视图中左侧的可选择的数据列表，比如工具列表、agent列表、终止条件列表等。
//仿照src\views\Tools\Agent_DIY\Data\Raw_Data.ts，我的意思是命名最好是相同的

import type { Agent, Workbench_Config_Tool, TerminationCondition } from './Raw_Data'

//第一个是agent列表
export const participants: Agent[] = [
  {
    provider: "autogen_agentchat.agents.AssistantAgent",
    component_type: "AssistantAgent",
    version: 1,
    component_version: 1,
    description: "负责规划和制定策略的智能代理",
    label: "规划助手",
    config: {
      name: "Planner_Agent",
      system_message: "你是一个专业的规划助手，擅长制定详细的计划和策略。你会帮助用户分析需求，制定可行的方案，并提供专业的建议。",
      description: "负责规划的Agent",
      model_client_stream: false,
      reflect_on_tool_use: false,
      tool_call_summary_format: "{tool_name} called with {args}",
      metadata: {},
      model_client: {
        provider: "autogen_ext.models.openai.OpenAIChatCompletionClient",
        component_type: "model",
        version: 1,
        component_version: 1,
        description: "OpenAI GPT-4模型配置",
        label: "GPT-4",
        config: {
          model: "gpt-4",
          api_key: "${OPENAI_API_KEY}",
          base_url: "https://api.openai.com/v1"
        }
      },
      workbench: [],
      model_context: {
        provider: "autogen_core.model_context.UnboundedChatCompletionContext",
        component_type: "chat_completion_context",
        version: 1,
        component_version: 1,
        description: "An unbounded chat completion context that keeps a view of the all the messages.",
        label: "UnboundedChatCompletionContext",
        config: {}
      },
      tools: []
    }
  },
  {
    provider: "autogen_agentchat.agents.AssistantAgent",
    component_type: "AssistantAgent",
    version: 1,
    component_version: 1,
    description: "负责内容创作和写作的智能代理",
    label: "写作助手",
    config: {
      name: "Writer_Agent",
      system_message: "你是一个专业的写作助手，擅长各种类型的文本创作。你会根据用户需求创作高质量的内容，包括文章、报告、创意文案等。",
      description: "负责写作的Agent",
      model_client_stream: false,
      reflect_on_tool_use: false,
      tool_call_summary_format: "{tool_name} called with {args}",
      metadata: {},
      model_client: {
        provider: "autogen_ext.models.openai.OpenAIChatCompletionClient",
        component_type: "model",
        version: 1,
        component_version: 1,
        description: "OpenAI GPT-4模型配置",
        label: "GPT-4",
        config: {
          model: "gpt-4",
          api_key: "${OPENAI_API_KEY}",
          base_url: "https://api.openai.com/v1"
        }
      },
      workbench: [],
      model_context: {
        provider: "autogen_core.model_context.UnboundedChatCompletionContext",
        component_type: "chat_completion_context",
        version: 1,
        component_version: 1,
        description: "An unbounded chat completion context that keeps a view of the all the messages.",
        label: "UnboundedChatCompletionContext",
        config: {}
      },
      tools: []
    }
  },
  {
    provider: "autogen_agentchat.agents.AssistantAgent",
    component_type: "AssistantAgent",
    version: 1,
    component_version: 1,
    description: "负责内容审查和质量控制的智能代理",
    label: "审查助手",
    config: {
      name: "Reviewer_Agent",
      system_message: "你是一个专业的内容审查员，擅长评估和改进内容质量。你会仔细检查内容的准确性、完整性和专业性，并提供建设性的改进建议。",
      description: "负责审核的Agent",
      model_client_stream: false,
      reflect_on_tool_use: false,
      tool_call_summary_format: "{tool_name} called with {args}",
      metadata: {},
      model_client: {
        provider: "autogen_ext.models.openai.OpenAIChatCompletionClient",
        component_type: "model",
        version: 1,
        component_version: 1,
        description: "OpenAI GPT-4模型配置",
        label: "GPT-4",
        config: {
          model: "gpt-4",
          api_key: "${OPENAI_API_KEY}",
          base_url: "https://api.openai.com/v1"
        }
      },
      workbench: [],
      model_context: {
        provider: "autogen_core.model_context.UnboundedChatCompletionContext",
        component_type: "chat_completion_context",
        version: 1,
        component_version: 1,
        description: "An unbounded chat completion context that keeps a view of the all the messages.",
        label: "UnboundedChatCompletionContext",
        config: {}
      },
      tools: []
    }
  },
  // 新增更多Agent选项
  {
    provider: "autogen_agentchat.agents.AssistantAgent",
    component_type: "AssistantAgent",
    version: 1,
    component_version: 1,
    description: "专业的翻译智能代理，支持多语言翻译",
    label: "翻译助手",
    config: {
      name: "Translator_Agent",
      system_message: "你是一个专业的翻译助手，精通多种语言翻译。你会准确理解源语言的含义，并提供自然流畅的目标语言翻译，保持原文的语调和风格。",
      description: "负责多语言翻译的Agent",
      model_client_stream: false,
      reflect_on_tool_use: false,
      tool_call_summary_format: "{tool_name} called with {args}",
      metadata: {},
      model_client: {
        provider: "autogen_ext.models.openai.OpenAIChatCompletionClient",
        component_type: "model",
        version: 1,
        component_version: 1,
        description: "OpenAI GPT-4模型配置",
        label: "GPT-4",
        config: {
          model: "gpt-4",
          api_key: "${OPENAI_API_KEY}",
          base_url: "https://api.openai.com/v1"
        }
      },
      workbench: [],
      model_context: {
        provider: "autogen_core.model_context.UnboundedChatCompletionContext",
        component_type: "chat_completion_context",
        version: 1,
        component_version: 1,
        description: "An unbounded chat completion context that keeps a view of the all the messages.",
        label: "UnboundedChatCompletionContext",
        config: {}
      },
      tools: []
    }
  },
  {
    provider: "autogen_agentchat.agents.AssistantAgent",
    component_type: "AssistantAgent",
    version: 1,
    component_version: 1,
    description: "数据分析专家，擅长数据处理和分析",
    label: "数据分析师",
    config: {
      name: "DataAnalyst_Agent",
      system_message: "你是一个专业的数据分析师，擅长数据清洗、统计分析、数据可视化和洞察发现。你会帮助用户理解数据背后的故事，并提供有价值的商业洞察。",
      description: "负责数据分析的Agent",
      model_client_stream: false,
      reflect_on_tool_use: false,
      tool_call_summary_format: "{tool_name} called with {args}",
      metadata: {},
      model_client: {
        provider: "autogen_ext.models.openai.OpenAIChatCompletionClient",
        component_type: "model",
        version: 1,
        component_version: 1,
        description: "OpenAI GPT-4模型配置",
        label: "GPT-4",
        config: {
          model: "gpt-4",
          api_key: "${OPENAI_API_KEY}",
          base_url: "https://api.openai.com/v1"
        }
      },
      workbench: [],
      model_context: {
        provider: "autogen_core.model_context.UnboundedChatCompletionContext",
        component_type: "chat_completion_context",
        version: 1,
        component_version: 1,
        description: "An unbounded chat completion context that keeps a view of the all the messages.",
        label: "UnboundedChatCompletionContext",
        config: {}
      },
      tools: []
    }
  },
  {
    provider: "autogen_agentchat.agents.AssistantAgent",
    component_type: "AssistantAgent",
    version: 1,
    component_version: 1,
    description: "智能客服代理，提供专业的客户服务",
    label: "客服助手",
    config: {
      name: "CustomerService_Agent",
      system_message: "你是一个专业的客服助手，具备优秀的沟通技巧和问题解决能力。你会耐心倾听客户需求，提供准确的信息和有效的解决方案，确保客户满意。",
      description: "负责客户服务的Agent",
      model_client_stream: false,
      reflect_on_tool_use: false,
      tool_call_summary_format: "{tool_name} called with {args}",
      metadata: {},
      model_client: {
        provider: "autogen_ext.models.openai.OpenAIChatCompletionClient",
        component_type: "model",
        version: 1,
        component_version: 1,
        description: "OpenAI GPT-4模型配置",
        label: "GPT-4",
        config: {
          model: "gpt-4",
          api_key: "${OPENAI_API_KEY}",
          base_url: "https://api.openai.com/v1"
        }
      },
      workbench: [],
      model_context: {
        provider: "autogen_core.model_context.UnboundedChatCompletionContext",
        component_type: "chat_completion_context",
        version: 1,
        component_version: 1,
        description: "An unbounded chat completion context that keeps a view of the all the messages.",
        label: "UnboundedChatCompletionContext",
        config: {}
      },
      tools: []
    }
  },
  {
    provider: "autogen_agentchat.agents.AssistantAgent",
    component_type: "AssistantAgent",
    version: 1,
    component_version: 1,
    description: "代码生成和编程助手",
    label: "代码助手",
    config: {
      name: "CodeGenerator_Agent",
      system_message: "你是一个专业的编程助手，精通多种编程语言和开发框架。你会根据需求生成高质量的代码，提供技术解决方案，并帮助优化代码性能。",
      description: "负责代码生成的Agent",
      model_client_stream: false,
      reflect_on_tool_use: false,
      tool_call_summary_format: "{tool_name} called with {args}",
      metadata: {},
      model_client: {
        provider: "autogen_ext.models.openai.OpenAIChatCompletionClient",
        component_type: "model",
        version: 1,
        component_version: 1,
        description: "OpenAI GPT-4模型配置",
        label: "GPT-4",
        config: {
          model: "gpt-4",
          api_key: "${OPENAI_API_KEY}",
          base_url: "https://api.openai.com/v1"
        }
      },
      workbench: [],
      model_context: {
        provider: "autogen_core.model_context.UnboundedChatCompletionContext",
        component_type: "chat_completion_context",
        version: 1,
        component_version: 1,
        description: "An unbounded chat completion context that keeps a view of the all the messages.",
        label: "UnboundedChatCompletionContext",
        config: {}
      },
      tools: []
    }
  },
  {
    provider: "autogen_agentchat.agents.AssistantAgent",
    component_type: "AssistantAgent",
    version: 1,
    component_version: 1,
    description: "市场营销专家，擅长营销策略和推广",
    label: "营销专家",
    config: {
      name: "Marketing_Agent",
      system_message: "你是一个专业的市场营销专家，具备丰富的营销策略制定和执行经验。你会分析市场趋势，制定有效的营销方案，并提供创新的推广建议。",
      description: "负责市场营销的Agent",
      model_client_stream: false,
      reflect_on_tool_use: false,
      tool_call_summary_format: "{tool_name} called with {args}",
      metadata: {},
      model_client: {
        provider: "autogen_ext.models.openai.OpenAIChatCompletionClient",
        component_type: "model",
        version: 1,
        component_version: 1,
        description: "OpenAI GPT-4模型配置",
        label: "GPT-4",
        config: {
          model: "gpt-4",
          api_key: "${OPENAI_API_KEY}",
          base_url: "https://api.openai.com/v1"
        }
      },
      workbench: [],
      model_context: {
        provider: "autogen_core.model_context.UnboundedChatCompletionContext",
        component_type: "chat_completion_context",
        version: 1,
        component_version: 1,
        description: "An unbounded chat completion context that keeps a view of the all the messages.",
        label: "UnboundedChatCompletionContext",
        config: {}
      },
      tools: []
    }
  },
  {
    provider: "autogen_agentchat.agents.AssistantAgent",
    component_type: "AssistantAgent",
    version: 1,
    component_version: 1,
    description: "教育培训专家，提供学习指导和知识传授",
    label: "教育助手",
    config: {
      name: "Education_Agent",
      system_message: "你是一个专业的教育助手，擅长知识传授和学习指导。你会根据学习者的水平制定个性化的学习计划，用通俗易懂的方式解释复杂概念。",
      description: "负责教育培训的Agent",
      model_client_stream: false,
      reflect_on_tool_use: false,
      tool_call_summary_format: "{tool_name} called with {args}",
      metadata: {},
      model_client: {
        provider: "autogen_ext.models.openai.OpenAIChatCompletionClient",
        component_type: "model",
        version: 1,
        component_version: 1,
        description: "OpenAI GPT-4模型配置",
        label: "GPT-4",
        config: {
          model: "gpt-4",
          api_key: "${OPENAI_API_KEY}",
          base_url: "https://api.openai.com/v1"
        }
      },
      workbench: [],
      model_context: {
        provider: "autogen_core.model_context.UnboundedChatCompletionContext",
        component_type: "chat_completion_context",
        version: 1,
        component_version: 1,
        description: "An unbounded chat completion context that keeps a view of the all the messages.",
        label: "UnboundedChatCompletionContext",
        config: {}
      },
      tools: []
    }
  }
]

//第二个是工具列表，现在应该是Workbench_Config_Tool
export const Tool_List: Workbench_Config_Tool[] = [
  {
    provider: "autogen_core.tools.WebSearchTool",
    component_type: "WebSearchTool",
    version: 1,
    component_version: 1,
    description: "互联网搜索工具，可以搜索最新的网络信息",
    label: "网络搜索",
    config: {
      name: "WebSearch",
      description: "搜索互联网信息，获取最新资讯和数据",
      global_imports: [],
      has_cancellation_support: false,
      source_code: `
def web_search(query: str) -> str:
    """
    搜索互联网信息
    Args:
        query: 搜索关键词
    Returns:
        搜索结果文本
    """
    # 这里应该调用实际的搜索API
    return f"搜索结果：{query}"
      `
    }
  },
  {
    provider: "autogen_core.tools.CalculatorTool",
    component_type: "CalculatorTool",
    version: 1,
    component_version: 1,
    description: "数学计算工具，支持各种数学运算",
    label: "计算器",
    config: {
      name: "Calculator",
      description: "执行数学计算，支持基础运算和复杂表达式",
      global_imports: [],
      has_cancellation_support: false,
      source_code: `
def calculate(expression: str) -> float:
    """
    执行数学计算
    Args:
        expression: 数学表达式
    Returns:
        计算结果
    """
    import math
    # 安全的数学表达式计算
    allowed_names = {
        k: v for k, v in math.__dict__.items() if not k.startswith("__")
    }
    allowed_names.update({"abs": abs, "round": round})
    return eval(expression, {"__builtins__": {}}, allowed_names)
      `
    }
  },
  {
    provider: "autogen_core.tools.KnowledgeBaseTool",
    component_type: "KnowledgeBaseTool",
    version: 1,
    component_version: 1,
    description: "企业知识库检索工具",
    label: "知识库检索",
    config: {
      name: "KnowledgeBase",
      description: "从企业知识库中检索相关信息和文档",
      global_imports: [],
      has_cancellation_support: false,
      source_code: `
def search_knowledge_base(query: str, category: str = "all") -> str:
    """
    从知识库检索信息
    Args:
        query: 检索关键词
        category: 检索分类
    Returns:
        检索结果
    """
    # 这里应该连接实际的知识库API
    return f"知识库检索结果：{query} (分类: {category})"
      `
    }
  },
  // 新增更多工具选项
  {
    provider: "autogen_core.tools.EmailSenderTool",
    component_type: "EmailSenderTool",
    version: 1,
    component_version: 1,
    description: "邮件发送工具，支持发送各种类型的邮件",
    label: "邮件发送器",
    config: {
      name: "EmailSender",
      description: "发送邮件，支持HTML格式和附件",
      global_imports: ["smtplib", "email"],
      has_cancellation_support: false,
      source_code: `
def send_email(to: str, subject: str, body: str, html: bool = False) -> str:
    """
    发送邮件
    Args:
        to: 收件人邮箱
        subject: 邮件主题
        body: 邮件内容
        html: 是否为HTML格式
    Returns:
        发送结果
    """
    # 这里应该调用实际的邮件发送API
    return f"邮件已发送到: {to}, 主题: {subject}"
      `
    }
  },
  {
    provider: "autogen_core.tools.FileProcessorTool",
    component_type: "FileProcessorTool",
    version: 1,
    component_version: 1,
    description: "文件处理工具，支持各种文件格式的读取和处理",
    label: "文件处理器",
    config: {
      name: "FileProcessor",
      description: "处理各种文件格式，包括PDF、Word、Excel等",
      global_imports: ["pandas", "PyPDF2", "openpyxl"],
      has_cancellation_support: false,
      source_code: `
def process_file(file_path: str, operation: str = "read") -> str:
    """
    处理文件
    Args:
        file_path: 文件路径
        operation: 操作类型（read、convert、analyze等）
    Returns:
        处理结果
    """
    # 这里应该实现文件处理逻辑
    return f"文件 {file_path} 已完成 {operation} 操作"
      `
    }
  },
  {
    provider: "autogen_core.tools.ImageGeneratorTool",
    component_type: "ImageGeneratorTool",
    version: 1,
    component_version: 1,
    description: "AI图像生成工具，基于文本描述生成图像",
    label: "图像生成器",
    config: {
      name: "ImageGenerator",
      description: "根据文本描述生成AI图像",
      global_imports: ["PIL", "requests"],
      has_cancellation_support: false,
      source_code: `
def generate_image(prompt: str, style: str = "realistic") -> str:
    """
    生成AI图像
    Args:
        prompt: 图像描述
        style: 图像风格
    Returns:
        生成的图像路径
    """
    # 这里应该调用AI图像生成API
    return f"已生成图像: {prompt} (风格: {style})"
      `
    }
  },
  {
    provider: "autogen_core.tools.DatabaseConnectorTool",
    component_type: "DatabaseConnectorTool",
    version: 1,
    component_version: 1,
    description: "数据库连接工具，支持多种数据库操作",
    label: "数据库连接器",
    config: {
      name: "DatabaseConnector",
      description: "连接和操作各种数据库",
      global_imports: ["sqlite3", "pymongo", "psycopg2"],
      has_cancellation_support: false,
      source_code: `
def query_database(query: str, db_type: str = "sqlite") -> str:
    """
    查询数据库
    Args:
        query: SQL查询语句
        db_type: 数据库类型
    Returns:
        查询结果
    """
    # 这里应该实现数据库连接和查询逻辑
    return f"数据库查询完成: {query}"
      `
    }
  },
  {
    provider: "autogen_core.tools.TextTranslatorTool",
    component_type: "TextTranslatorTool",
    version: 1,
    component_version: 1,
    description: "多语言翻译工具，支持100+种语言互译",
    label: "文本翻译器",
    config: {
      name: "TextTranslator",
      description: "多语言文本翻译",
      global_imports: ["googletrans", "langdetect"],
      has_cancellation_support: false,
      source_code: `
def translate_text(text: str, target_lang: str = "en", source_lang: str = "auto") -> str:
    """
    翻译文本
    Args:
        text: 要翻译的文本
        target_lang: 目标语言
        source_lang: 源语言（auto为自动检测）
    Returns:
        翻译结果
    """
    # 这里应该调用翻译API
    return f"翻译结果: {text} -> {target_lang}"
      `
    }
  },
  {
    provider: "autogen_core.tools.WeatherTool",
    component_type: "WeatherTool",
    version: 1,
    component_version: 1,
    description: "天气查询工具，获取实时天气和预报信息",
    label: "天气查询器",
    config: {
      name: "WeatherQuery",
      description: "查询天气信息和预报",
      global_imports: ["requests", "json"],
      has_cancellation_support: false,
      source_code: `
def get_weather(location: str, days: int = 1) -> str:
    """
    查询天气信息
    Args:
        location: 地理位置
        days: 预报天数
    Returns:
        天气信息
    """
    # 这里应该调用天气API
    return f"{location} 天气: 晴朗, 25°C (预报{days}天)"
      `
    }
  },
  {
    provider: "autogen_core.tools.CodeRunnerTool",
    component_type: "CodeRunnerTool",
    version: 1,
    component_version: 1,
    description: "代码执行工具，支持多种编程语言的代码运行",
    label: "代码执行器",
    config: {
      name: "CodeRunner",
      description: "安全执行各种编程语言代码",
      global_imports: ["subprocess", "tempfile"],
      has_cancellation_support: true,
      source_code: `
def run_code(code: str, language: str = "python") -> str:
    """
    执行代码
    Args:
        code: 代码内容
        language: 编程语言
    Returns:
        执行结果
    """
    # 这里应该实现安全的代码执行环境
    return f"代码执行完成 ({language}): {code[:50]}..."
      `
    }
  },
  {
    provider: "autogen_core.tools.QRCodeTool",
    component_type: "QRCodeTool",
    version: 1,
    component_version: 1,
    description: "二维码生成和识别工具",
    label: "二维码工具",
    config: {
      name: "QRCodeTool",
      description: "生成和识别二维码",
      global_imports: ["qrcode", "cv2"],
      has_cancellation_support: false,
      source_code: `
def generate_qrcode(data: str, size: int = 10) -> str:
    """
    生成二维码
    Args:
        data: 要编码的数据
        size: 二维码大小
    Returns:
        二维码图片路径
    """
    # 这里应该实现二维码生成逻辑
    return f"二维码已生成: {data}"
      `
    }
  },
  {
    provider: "autogen_core.tools.NotificationTool",
    component_type: "NotificationTool",
    version: 1,
    component_version: 1,
    description: "消息通知工具，支持多种通知方式",
    label: "消息通知器",
    config: {
      name: "NotificationSender",
      description: "发送各种类型的通知消息",
      global_imports: ["requests", "json"],
      has_cancellation_support: false,
      source_code: `
def send_notification(message: str, platform: str = "slack", channel: str = "general") -> str:
    """
    发送通知
    Args:
        message: 通知内容
        platform: 通知平台（slack、wechat、email等）
        channel: 频道或群组
    Returns:
        发送结果
    """
    # 这里应该调用相应的通知API
    return f"通知已发送到 {platform}/{channel}: {message}"
      `
    }
  }
]

//第三个是终止条件列表
export const termination_condition_List: TerminationCondition[] = [
  {
    provider: "autogen_agentchat",
    component_type: "TextMentionTermination",
    version: 1,
    component_version: 1,
    description: "当对话中出现指定文本时终止",
    label: "文本触发终止",
    config: {
      text: "PUBLISH"
    }
  },
  {
    provider: "autogen_agentchat",
    component_type: "MaxTurnTermination", 
    version: 1,
    component_version: 1,
    description: "达到最大轮数时终止对话",
    label: "最大轮数终止",
    config: {
      text: "MAX_TURNS_REACHED"
    }
  },
  {
    provider: "autogen_agentchat",
    component_type: "TimeoutTermination",
    version: 1,
    component_version: 1,
    description: "超时终止对话",
    label: "超时终止",
    config: {
      text: "TIMEOUT"
    }
  },
  // 新增更多终止条件选项
  {
    provider: "autogen_agentchat",
    component_type: "SuccessTermination",
    version: 1,
    component_version: 1,
    description: "任务成功完成时终止",
    label: "成功完成终止",
    config: {
      text: "SUCCESS"
    }
  },
  {
    provider: "autogen_agentchat",
    component_type: "ErrorTermination",
    version: 1,
    component_version: 1,
    description: "出现错误时终止对话",
    label: "错误终止",
    config: {
      text: "ERROR"
    }
  },
  {
    provider: "autogen_agentchat",
    component_type: "UserConfirmTermination",
    version: 1,
    component_version: 1,
    description: "需要用户确认才终止",
    label: "用户确认终止",
    config: {
      text: "CONFIRM"
    }
  },
  {
    provider: "autogen_agentchat",
    component_type: "StopWordTermination",
    version: 1,
    component_version: 1,
    description: "遇到停止词时终止",
    label: "停止词终止",
    config: {
      text: "STOP"
    }
  },
  {
    provider: "autogen_agentchat",
    component_type: "ConversationLengthTermination",
    version: 1,
    component_version: 1,
    description: "对话长度达到限制时终止",
    label: "对话长度终止",
    config: {
      text: "MAX_LENGTH"
    }
  },
  {
    provider: "autogen_agentchat",
    component_type: "QualityThresholdTermination",
    version: 1,
    component_version: 1,
    description: "质量评分达到阈值时终止",
    label: "质量阈值终止",
    config: {
      text: "QUALITY_ACHIEVED"
    }
  },
  {
    provider: "autogen_agentchat",
    component_type: "ConsensusTermination",
    version: 1,
    component_version: 1,
    description: "所有参与者达成共识时终止",
    label: "共识终止",
    config: {
      text: "CONSENSUS"
    }
  },
  {
    provider: "autogen_agentchat",
    component_type: "ResourceExhaustionTermination",
    version: 1,
    component_version: 1,
    description: "资源耗尽时终止（如Token用完）",
    label: "资源耗尽终止",
    config: {
      text: "RESOURCE_EXHAUSTED"
    }
  }
]

