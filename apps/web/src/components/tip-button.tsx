"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { createTipSession } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const AMOUNT_PRESETS = [
  { label: "¥100", amount: 100 },
  { label: "¥500", amount: 500 },
  { label: "¥1,000", amount: 1000 },
];

interface TipButtonProps {
  articleId: string;
}

export function TipButton({ articleId }: TipButtonProps) {
  const [open, setOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [tipperName, setTipperName] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const amount =
    selectedAmount ?? (customAmount ? parseInt(customAmount, 10) : 0);
  const isValidAmount = amount >= 100 && amount <= 10000;

  function handlePresetClick(value: number) {
    setSelectedAmount(value);
    setCustomAmount("");
    setError("");
  }

  function handleCustomAmountChange(value: string) {
    setCustomAmount(value);
    setSelectedAmount(null);
    setError("");
  }

  function resetForm() {
    setSelectedAmount(null);
    setCustomAmount("");
    setTipperName("");
    setMessage("");
    setError("");
  }

  async function handleSubmit() {
    if (!isValidAmount || isSubmitting) return;

    setIsSubmitting(true);
    setError("");

    try {
      const { session_url } = await createTipSession(articleId, {
        amount,
        tipper_name: tipperName || undefined,
        message: message || undefined,
        success_url: `${window.location.origin}/articles/${articleId}/tip/success`,
        cancel_url: window.location.href,
      });

      window.location.href = session_url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => {
          resetForm();
          setOpen(true);
        }}
        className="group flex items-center gap-1.5 text-sm text-gray-400 cursor-pointer hover:text-emerald-500 hover:scale-105 active:scale-95 transition-all"
        aria-label="応援する"
      >
        <Heart className="size-4 group-hover:text-emerald-500 transition-colors" />
        <span>応援する</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white p-6 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900">応援する</DialogTitle>
            <DialogDescription className="text-gray-500">
              この記事が役に立ったら、チップで応援できます
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Amount presets */}
            <div>
              <Label className="text-gray-700 mb-2">金額</Label>
              <div className="flex gap-2 mt-1">
                {AMOUNT_PRESETS.map((preset) => (
                  <Button
                    key={preset.amount}
                    type="button"
                    variant={selectedAmount === preset.amount ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePresetClick(preset.amount)}
                    className={
                      selectedAmount === preset.amount
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "border-gray-300 text-gray-700 hover:border-emerald-500 hover:text-emerald-600"
                    }
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
              <div className="mt-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    ¥
                  </span>
                  <Input
                    type="number"
                    min="100"
                    max="10000"
                    step="1"
                    placeholder="自由入力"
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    className="pl-7 border-gray-300 text-gray-900 placeholder:text-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Name */}
            <div>
              <Label htmlFor="tipper-name" className="text-gray-700">
                お名前
              </Label>
              <Input
                id="tipper-name"
                type="text"
                maxLength={100}
                placeholder="匿名"
                value={tipperName}
                onChange={(e) => setTipperName(e.target.value)}
                className="mt-1 border-gray-300 text-gray-900 placeholder:text-gray-400"
              />
            </div>

            {/* Message */}
            <div>
              <Label htmlFor="tip-message" className="text-gray-700">
                メッセージ{" "}
                <span className="font-normal text-gray-400">(任意)</span>
              </Label>
              <textarea
                id="tip-message"
                maxLength={500}
                rows={3}
                placeholder="ひとことメッセージ..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1 w-full min-w-0 rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] resize-none"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={!isValidAmount || isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSubmitting
                ? "決済ページへ移動中..."
                : isValidAmount
                  ? `¥${amount.toLocaleString()} を送る`
                  : "金額を選択してください"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
