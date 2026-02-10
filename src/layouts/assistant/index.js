/**
 * DCG Admin Dashboard - Jenkins Assistant
 * AI-powered assistant for DCG employees
 * Answers questions about codebase, troubleshooting, strategy, and company context
 */

import { useState, useRef, useEffect } from "react";
import DOMPurify from "dompurify";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import api from "services/api";

function Assistant() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I'm Jenkins Assistant, your AI helper for DCG. I can answer questions about:\n\n" +
        "• **Codebase**: Asterisk dialplan, Node.js backend, React dashboard, FreeSWITCH\n" +
        "• **Troubleshooting**: Debug issues, check logs, fix common problems\n" +
        "• **Company Context**: DCG history, team, product features\n" +
        "• **Strategy**: Business goals, pitch deck, market opportunity\n\n" +
        "What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const response = await api.askJenkinsAssistant(userMessage);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.answer || response.message || "I couldn't process that.",
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I encountered an error. Please try again or check if the API is running.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedQuestions = [
    "How does the GTL integration work?",
    "Explain the Asterisk dialplan structure",
    "What are the 18 radio stations?",
    "How do I check system logs?",
    "Explain the Stripe integration",
  ];

  const handleSuggestion = (question) => {
    setInput(question);
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox
        py={3}
        sx={{ height: "calc(100vh - 200px)", display: "flex", flexDirection: "column" }}
      >
        <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <MDBox display="flex" alignItems="center" gap={1}>
            <Icon color="info" sx={{ fontSize: 32 }}>
              smart_toy
            </Icon>
            <MDTypography variant="h4" fontWeight="bold">
              Jenkins Assistant
            </MDTypography>
          </MDBox>
          <Chip label="AI Powered" color="info" size="small" icon={<Icon>auto_awesome</Icon>} />
        </MDBox>

        {/* Chat Messages */}
        <Card sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <MDBox sx={{ flex: 1, overflow: "auto", p: 2 }}>
            {messages.map((msg, idx) => (
              <MDBox
                key={idx}
                display="flex"
                justifyContent={msg.role === "user" ? "flex-end" : "flex-start"}
                mb={2}
              >
                <MDBox
                  sx={{
                    maxWidth: "80%",
                    backgroundColor: msg.role === "user" ? "#1A73E8" : "#f5f5f5",
                    color: msg.role === "user" ? "white" : "inherit",
                    borderRadius: 2,
                    p: 2,
                  }}
                >
                  <MDTypography
                    variant="body2"
                    sx={{ whiteSpace: "pre-wrap", "& strong": { fontWeight: "bold" } }}
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(
                        msg.content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                        {
                          ALLOWED_TAGS: ["strong", "em", "b", "i", "br", "p", "span"],
                          ALLOWED_ATTR: [],
                        }
                      ),
                    }}
                  />
                </MDBox>
              </MDBox>
            ))}
            {loading && (
              <MDBox display="flex" justifyContent="flex-start" mb={2}>
                <MDBox sx={{ backgroundColor: "#f5f5f5", borderRadius: 2, p: 2 }}>
                  <CircularProgress size={20} />
                </MDBox>
              </MDBox>
            )}
            <div ref={messagesEndRef} />
          </MDBox>

          {/* Suggested Questions */}
          {messages.length === 1 && (
            <MDBox px={2} pb={1}>
              <MDTypography variant="caption" color="text" mb={1} display="block">
                Suggested questions:
              </MDTypography>
              <MDBox display="flex" flexWrap="wrap" gap={1}>
                {suggestedQuestions.map((q, idx) => (
                  <Chip
                    key={idx}
                    label={q}
                    size="small"
                    onClick={() => handleSuggestion(q)}
                    sx={{ cursor: "pointer", "&:hover": { backgroundColor: "#e3f2fd" } }}
                  />
                ))}
              </MDBox>
            </MDBox>
          )}

          {/* Input Form */}
          <MDBox
            component="form"
            onSubmit={handleSubmit}
            sx={{ p: 2, borderTop: "1px solid #eee", display: "flex", gap: 1 }}
          >
            <TextField
              fullWidth
              placeholder="Ask anything about DCG..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              size="small"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
            <MDButton type="submit" color="info" disabled={loading || !input.trim()}>
              <Icon>send</Icon>
            </MDButton>
          </MDBox>
        </Card>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Assistant;
