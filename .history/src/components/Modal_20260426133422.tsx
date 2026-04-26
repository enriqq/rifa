import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Modal({
    open,
    onClose,
    children,
}: {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
}) {
    return (
        <AnimatePresence>
            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="bg-[#181818] rounded-2xl p-6 max-w-2xl w-full relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 text-gray-400 hover:text-white text-xl"
                        >
                            &times;
                        </button>
                        {children}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

function formatDescription(text: string) {
  // Divide en líneas
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);

  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];

  lines.forEach((line, idx) => {
    // Subtítulo (ejemplo: "Datos de la botella 700 ml")
    if (/^Datos de la botella/i.test(line)) {
      if (inList && listItems.length) {
        elements.push(<ul className="mb-2 ml-4 list-disc text-sm text-gray-300">{listItems}</ul>);
        listItems = [];
        inList = false;
      }
      elements.push(
        <div key={`subtitle-${idx}`} className="font-semibold text-base mt-4 mb-1 text-white">
          {line}
        </div>
      );
      return;
    }

    // Lista (líneas que empiezan con "- " o "• ")
    if (/^[-•]\s+/.test(line)) {
      inList = true;
      // Negrita para la palabra antes de los dos puntos
      const match = line.match(/^[-•]\s*(.*?):\s*(.*)$/);
      if (match) {
        listItems.push(
          <li key={`li-${idx}`}>
            <span className="font-semibold text-white">{match[1]}:</span> {match[2]}
          </li>
        );
      } else {
        listItems.push(<li key={`li-${idx}`}>{line.replace(/^[-•]\s*/, '')}</li>);
      }
      return;
    }

    // Si termina la lista
    if (inList && !/^[-•]\s+/.test(line)) {
        elements.push(<ul className="mb-2 ml-4 list-disc text-sm text-gray-300">{listItems}</ul>);
        listItems = [];
        inList = false;
    }

    // Título (primera línea o líneas en mayúsculas)
    if (idx === 0 || /^[A-ZÁÉÍÓÚÑ\s\d]+$/.test(line)) {
        elements.push(
            <div key={`title-${idx}`} className="font-bold text-lg mb-2 text-white">
                {line}
            </div>
        );
        return;
    }

    // Negrita para palabras clave al inicio de la línea
    const boldMatch = line.match(/^(.*?):\s*(.*)$/);
    if (boldMatch) {
        elements.push(
            <div key={`bold-${idx}`} className="mb-1">
                <span className="font-semibold text-white">{boldMatch[1]}:</span> {boldMatch[2]}
            </div>
        );
        return;
    }

    // Párrafo normal
    elements.push(
        <div key={`p-${idx}`} className="mb-2 text-gray-300 text-sm">
            {line}
        </div>
    );
  });

  // Si termina en lista
  if (inList && listItems.length) {
    elements.push(<ul className="mb-2 ml-4 list-disc text-sm text-gray-300">{listItems}</ul>);
  }

  return <div className="text-left">{elements}</div>;
}

{modalPrize && (
  <div className="text-center">
    <img
      src={modalPrize.image_url}
      alt={modalPrize.name}
      className="w-full h-64 object-cover rounded-xl mb-4"
    />
    <h2 className="text-2xl font-bold text-white mb-4">{modalPrize.name}</h2>
    {formatDescription(modalPrize.description)}
    <div className="text-lg font-semibold mt-4" style={{ color: GOLD }}>
      ${modalPrize.ticket_price?.toLocaleString?.() ?? ""} MXN{" "}
      <span className="text-sm text-gray-500">/ boleto</span>
    </div>
  </div>
)}
