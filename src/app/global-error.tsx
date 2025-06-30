"use client";

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    // Capturar o erro no Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "2rem",
          backgroundColor: "#f8f9fa",
          fontFamily: "system-ui, -apple-system, sans-serif"
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "3rem",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            maxWidth: "600px",
            width: "100%"
          }}>
            <h1 style={{
              fontSize: "2rem",
              fontWeight: "bold",
              color: "#dc3545",
              marginBottom: "1rem",
              textAlign: "center"
            }}>
              Oops! Algo deu errado
            </h1>
            
            <p style={{
              fontSize: "1.1rem",
              color: "#6c757d",
              textAlign: "center",
              marginBottom: "2rem"
            }}>
              Encontramos um erro inesperado. Nossa equipe foi notificada e estamos trabalhando para resolver o problema.
            </p>
            
            {process.env.NODE_ENV === "development" && (
              <details style={{
                backgroundColor: "#f8d7da",
                color: "#721c24",
                padding: "1rem",
                borderRadius: "8px",
                marginBottom: "2rem"
              }}>
                <summary style={{ cursor: "pointer", fontWeight: "bold" }}>
                  Detalhes do erro (desenvolvimento)
                </summary>
                <pre style={{
                  marginTop: "1rem",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word"
                }}>
                  {error.stack || error.message}
                </pre>
                {error.digest && (
                  <p style={{ marginTop: "0.5rem" }}>
                    Digest: {error.digest}
                  </p>
                )}
              </details>
            )}
            
            <div style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center"
            }}>
              <button
                onClick={() => window.location.href = "/"}
                style={{
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "6px",
                  fontSize: "1rem",
                  cursor: "pointer",
                  fontWeight: "500"
                }}
              >
                Voltar ao Início
              </button>
              
              <button
                onClick={() => window.location.reload()}
                style={{
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "6px",
                  fontSize: "1rem",
                  cursor: "pointer",
                  fontWeight: "500"
                }}
              >
                Tentar Novamente
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
} 