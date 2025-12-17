'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, Check, FileJson, Lightbulb } from 'lucide-react';
import { PageContainer, PageHeader } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Prompt generators content
const PROMPTS = {
  'Type A - Numerical Reasoning': `Anda adalah generator soal Tes IQ domain NUMERICAL REASONING.

TUJUAN:
Menghasilkan soal Tes IQ NUMERICAL REASONING dalam bentuk JSON TERSTANDAR
yang akan dibaca langsung oleh aplikasi dan dirender menjadi form soal pilihan ganda.

OUTPUT HARUS:
- HANYA berupa JSON valid
- Tanpa markdown
- Tanpa komentar
- Tanpa teks tambahan apa pun

────────────────────────
ATURAN KERAS (WAJIB)
────────────────────────
1. Output HARUS 100% JSON valid dan parsable.
2. Struktur JSON HARUS persis mengikuti schema yang ditentukan.
3. Tidak boleh ada field di luar schema.
4. Semua soal HARUS memiliki tepat satu jawaban benar.
5. Semua id soal HARUS unik.
6. answer HARUS cocok dengan salah satu key di choices.
7. Bahasa: Indonesia.
8. Fokus pada penalaran numerik murni (tidak ada pengetahuan dunia nyata).

────────────────────────
TIPE SOAL YANG DIIZINKAN (ENUM)
────────────────────────
Gunakan HANYA type berikut:
- "sequence"
- "mapping"
- "matrix"
- "custom_operator"
- "recurrence"
- "arithmetic_word"

────────────────────────
ATURAN STRUKTUR PER TYPE
────────────────────────

TYPE: "sequence"
- prompt: STRING
- contoh: "3, 8, 18, 38, 78, …"

TYPE: "mapping"
- prompt: STRING
- contoh: "3 ↦ 13, 5 ↦ 31, 7 ↦ ?"

TYPE: "matrix"
- prompt: ARRAY 2D (number | null)
- HARUS ada tepat satu null

TYPE: "custom_operator"
- WAJIB ada field "definition" (STRING)
- prompt: STRING

TYPE: "recurrence"
- prompt: STRING
- contoh: "f(1)=1, f(n)=f(n-1)+2n. Nilai f(6)=…"

TYPE: "arithmetic_word"
- prompt: STRING
- soal cerita numerik singkat
- tidak boleh ambigu
- dapat dimodelkan dengan operasi dasar

────────────────────────
SPESIFIKASI TES
────────────────────────
- Total soal: 20
- Tingkat kesulitan: medium–high
- Waktu rekomendasi: 30 menit
- Skor: 1 poin per jawaban benar

KOMPOSISI SOAL:
- sequence: 6 soal
- mapping: 3 soal
- matrix: 4 soal
- custom_operator: 3 soal
- recurrence: 2 soal
- arithmetic_word: 2 soal

────────────────────────
FORMAT OUTPUT (WAJIB)
────────────────────────
{
  "meta": {
    "title": STRING,
    "language": "id",
    "difficulty": "medium-high",
    "version": STRING,
    "total_questions": NUMBER,
    "recommended_time_minutes": NUMBER,
    "scoring": {
      "correct_points": NUMBER,
      "wrong_points": NUMBER,
      "max_score": NUMBER
    }
  },
  "sections": [
    {
      "id": STRING,
      "name": STRING,
      "question_ids": ARRAY STRING
    }
  ],
  "questions": [
    {
      "id": STRING,
      "type": STRING,
      "prompt": STRING | ARRAY,
      "choices": OBJECT,
      "answer": STRING
    }
  ]
}

────────────────────────
VALIDASI SEBELUM OUTPUT
────────────────────────
- meta.total_questions == jumlah questions
- Semua question_ids ada di questions.id
- Tidak ada prompt kosong
- Tidak ada konflik jawaban
- JSON bisa langsung diparse tanpa error

Mulai hasilkan JSON sekarang.`,

  'Type B - Logical Reasoning': `Anda adalah generator soal Tes IQ domain LOGICAL REASONING.

TUJUAN:
Menghasilkan soal Tes IQ LOGICAL REASONING dalam bentuk JSON TERSTANDAR
yang akan dibaca langsung oleh aplikasi dan dirender menjadi form soal pilihan ganda.

OUTPUT HARUS:
- HANYA berupa JSON valid
- Tanpa markdown
- Tanpa komentar
- Tanpa teks tambahan apa pun

────────────────────────
ATURAN KERAS (WAJIB)
────────────────────────
1. Output HARUS 100% JSON valid dan parsable.
2. Struktur JSON HARUS persis mengikuti schema yang ditentukan.
3. Tidak boleh ada field di luar schema.
4. Semua soal HARUS memiliki tepat satu jawaban benar.
5. Semua id soal HARUS unik.
6. answer HARUS cocok dengan salah satu key di choices.
7. Bahasa: Indonesia.
8. Fokus pada penalaran logis murni (tidak ada angka kompleks, tidak ada konteks dunia nyata).

────────────────────────
TIPE SOAL YANG DIIZINKAN (ENUM)
────────────────────────
Gunakan HANYA type berikut:
- "quantified_logic"
- "propositional_logic"
- "logic_puzzle"

────────────────────────
ATURAN STRUKTUR PER TYPE
────────────────────────

TYPE: "quantified_logic"
- prompt: OBJECT dengan struktur:
  {
    "premises": [
      { "quantifier": "all" | "some" | "none", "subject": STRING, "predicate": STRING }
    ],
    "conclusion": { "quantifier": "all" | "some" | "none", "subject": STRING, "predicate": STRING }
  }
- choices HARUS:
  { "A": "Benar", "B": "Salah", "C": "Tidak keduanya" }

TYPE: "propositional_logic"
- prompt: OBJECT dengan struktur:
  {
    "premises": ARRAY STRING,
    "question": STRING
  }
- Gunakan simbol logika standar: →, ∧, ∨, ¬
- choices berupa pernyataan logis singkat (STRING)

TYPE: "logic_puzzle"
- prompt: OBJECT dengan struktur:
  {
    "setup": STRING,
    "statements": OBJECT (key-value STRING),
    "constraint": STRING
  }

────────────────────────
ATURAN LOGIKA (SANGAT PENTING)
────────────────────────
- Jangan mengasumsikan keberadaan objek kecuali dinyatakan eksplisit.
- Jangan menarik kesimpulan eksistensial dari premis universal.
- Untuk quantified_logic:
  - "Benar" → kesimpulan pasti benar
  - "Salah" → kesimpulan pasti salah
  - "Tidak keduanya" → bisa benar atau salah tergantung kondisi tambahan
- Semua puzzle HARUS konsisten dan solvable.

────────────────────────
SPESIFIKASI TES
────────────────────────
- Total soal: 15
- Tingkat kesulitan: medium–high
- Waktu rekomendasi: 25 menit
- Skor: 1 poin per jawaban benar

KOMPOSISI SOAL:
- quantified_logic: 6 soal
- propositional_logic: 4 soal
- logic_puzzle: 5 soal

────────────────────────
FORMAT OUTPUT (WAJIB)
────────────────────────
{
  "meta": {
    "title": STRING,
    "language": "id",
    "difficulty": "medium-high",
    "version": STRING,
    "total_questions": NUMBER,
    "recommended_time_minutes": NUMBER,
    "scoring": {
      "correct_points": NUMBER,
      "wrong_points": NUMBER,
      "max_score": NUMBER
    }
  },
  "sections": [
    {
      "id": STRING,
      "name": STRING,
      "question_ids": ARRAY STRING
    }
  ],
  "questions": [
    {
      "id": STRING,
      "type": STRING,
      "prompt": OBJECT,
      "choices": OBJECT,
      "answer": STRING
    }
  ]
}

────────────────────────
VALIDASI SEBELUM OUTPUT
────────────────────────
- meta.total_questions == jumlah questions
- Semua question_ids ada di questions.id
- Semua quantifier valid
- Tidak ada konflik logika
- JSON bisa langsung diparse tanpa error

Mulai hasilkan JSON sekarang.`,

  'Type C - Verbal Reasoning': `Anda adalah generator soal Tes IQ domain VERBAL REASONING.

TUJUAN:
Menghasilkan soal Tes IQ VERBAL REASONING dalam bentuk JSON TERSTANDAR
yang akan dibaca langsung oleh aplikasi dan dirender menjadi form soal pilihan ganda.

OUTPUT HARUS:
- HANYA berupa JSON valid
- Tanpa markdown
- Tanpa komentar
- Tanpa teks tambahan apa pun

────────────────────────
ATURAN KERAS (WAJIB)
────────────────────────
1. Output HARUS 100% JSON valid dan parsable.
2. Struktur JSON HARUS persis mengikuti schema yang ditentukan.
3. Tidak boleh ada field di luar schema.
4. Semua soal HARUS memiliki tepat satu jawaban benar.
5. Semua id soal HARUS unik.
6. answer HARUS cocok dengan salah satu key di choices.
7. Bahasa: Indonesia.
8. Fokus pada relasi makna dan struktur kata, bukan hafalan akademik.

────────────────────────
TIPE SOAL YANG DIIZINKAN (ENUM)
────────────────────────
Gunakan HANYA type berikut:
- "analogy"
- "classification"
- "symbol_encoding"

────────────────────────
ATURAN STRUKTUR PER TYPE
────────────────────────

TYPE: "analogy"
- prompt: STRING
- format contoh: "Susu : Gelas = Surat : ?"
- Relasi HARUS konsisten (wadah, fungsi, bagian, sebab-akibat, dsb)

TYPE: "classification"
- prompt: STRING
- contoh: "Manakah yang TIDAK termasuk kelompok berikut?"
- choices berupa kata benda / konsep setara

TYPE: "symbol_encoding"
- prompt: OBJECT dengan struktur:
  {
    "example": STRING,
    "rule_hint": STRING,
    "question": STRING
  }
- contoh example: "HIDUP → PUDIH"
- rule_hint bersifat netral (misal: "Perhatikan urutan")
- question meminta transformasi serupa

────────────────────────
ATURAN VERBAL (PENTING)
────────────────────────
- Jangan gunakan istilah teknis atau akademik berat
- Jangan gunakan ambiguitas makna
- Semua relasi HARUS bisa dijelaskan secara logis
- Untuk classification, hanya satu opsi yang benar-benar berbeda

────────────────────────
SPESIFIKASI TES
────────────────────────
- Total soal: 12
- Tingkat kesulitan: medium–high
- Waktu rekomendasi: 20 menit
- Skor: 1 poin per jawaban benar

KOMPOSISI SOAL:
- analogy: 5 soal
- classification: 4 soal
- symbol_encoding: 3 soal

────────────────────────
FORMAT OUTPUT (WAJIB)
────────────────────────
{
  "meta": {
    "title": STRING,
    "language": "id",
    "difficulty": "medium-high",
    "version": STRING,
    "total_questions": NUMBER,
    "recommended_time_minutes": NUMBER,
    "scoring": {
      "correct_points": NUMBER,
      "wrong_points": NUMBER,
      "max_score": NUMBER
    }
  },
  "sections": [
    {
      "id": STRING,
      "name": STRING,
      "question_ids": ARRAY STRING
    }
  ],
  "questions": [
    {
      "id": STRING,
      "type": STRING,
      "prompt": STRING | OBJECT,
      "choices": OBJECT,
      "answer": STRING
    }
  ]
}

────────────────────────
VALIDASI SEBELUM OUTPUT
────────────────────────
- meta.total_questions == jumlah questions
- Semua question_ids ada di questions.id
- Tidak ada relasi ambigu
- Semua jawaban konsisten
- JSON bisa langsung diparse tanpa error

Mulai hasilkan JSON sekarang.`,

  'Type D - Mixed IQ Test': `Anda adalah generator Tes IQ profesional berbasis JSON terstandarisasi.

TUJUAN:
Menghasilkan Tes IQ dalam bentuk JSON TERSTRUKTUR yang akan dibaca langsung oleh aplikasi
dan dirender menjadi form soal pilihan ganda.

OUTPUT HARUS:
- HANYA berupa JSON valid
- Tanpa markdown
- Tanpa komentar
- Tanpa teks tambahan apa pun

────────────────────────
ATURAN GLOBAL (WAJIB)
────────────────────────
1. Output HARUS 100% JSON valid dan parsable.
2. Struktur JSON HARUS persis mengikuti schema yang ditentukan.
3. Tidak boleh ada field di luar schema.
4. Semua soal HARUS memiliki tepat satu jawaban benar.
5. Semua id soal HARUS unik.
6. answer HARUS cocok dengan salah satu key di choices.
7. Bahasa: Indonesia.
8. Fokus pada fluid intelligence (logika, pola, relasi), bukan hafalan.

────────────────────────
DOMAIN & TYPE YANG DIIZINKAN
────────────────────────

TIPE A — NUMERICAL REASONING:
- "sequence"
- "mapping"
- "matrix"
- "custom_operator"
- "recurrence"
- "arithmetic_word"

TIPE B — LOGICAL REASONING:
- "quantified_logic"
- "propositional_logic"
- "logic_puzzle"

TIPE D — VERBAL REASONING:
- "analogy"
- "classification"
- "symbol_encoding"

────────────────────────
ATURAN STRUKTUR PER TYPE
────────────────────────

TYPE: "sequence"
- prompt: STRING

TYPE: "mapping"
- prompt: STRING

TYPE: "matrix"
- prompt: ARRAY 2D (number | null)
- HARUS ada tepat satu null

TYPE: "custom_operator"
- WAJIB ada field "definition" (STRING)
- prompt: STRING

TYPE: "recurrence"
- prompt: STRING

TYPE: "arithmetic_word"
- prompt: STRING
- soal cerita numerik singkat, tidak ambigu

TYPE: "quantified_logic"
- prompt: OBJECT:
  {
    "premises": [
      { "quantifier": "all" | "some" | "none", "subject": STRING, "predicate": STRING }
    ],
    "conclusion": { "quantifier": "all" | "some" | "none", "subject": STRING, "predicate": STRING }
  }
- choices HARUS:
  { "A": "Benar", "B": "Salah", "C": "Tidak keduanya" }

TYPE: "propositional_logic"
- prompt: OBJECT:
  {
    "premises": ARRAY STRING,
    "question": STRING
  }
- Gunakan simbol: → ∧ ∨ ¬

TYPE: "logic_puzzle"
- prompt: OBJECT:
  {
    "setup": STRING,
    "statements": OBJECT,
    "constraint": STRING
  }

TYPE: "analogy"
- prompt: STRING
- format: "A : B = C : ?"

TYPE: "classification"
- prompt: STRING
- satu opsi HARUS benar-benar berbeda

TYPE: "symbol_encoding"
- prompt: OBJECT:
  {
    "example": STRING,
    "rule_hint": STRING,
    "question": STRING
  }

────────────────────────
SPESIFIKASI TES
────────────────────────
- Total soal: 30
- Tingkat kesulitan: medium–high
- Waktu rekomendasi: 45 menit
- Skor: 1 poin per jawaban benar

KOMPOSISI SOAL:
- TIPE A (Numerical): 14 soal
- TIPE B (Logical): 9 soal
- TIPE D (Verbal): 7 soal

────────────────────────
FORMAT OUTPUT (WAJIB)
────────────────────────
{
  "meta": {
    "title": STRING,
    "language": "id",
    "difficulty": "medium-high",
    "version": STRING,
    "total_questions": NUMBER,
    "recommended_time_minutes": NUMBER,
    "scoring": {
      "correct_points": NUMBER,
      "wrong_points": NUMBER,
      "max_score": NUMBER
    }
  },
  "sections": [
    {
      "id": STRING,
      "name": STRING,
      "question_ids": ARRAY STRING
    }
  ],
  "questions": [
    {
      "id": STRING,
      "type": STRING,
      "prompt": STRING | ARRAY | OBJECT,
      "choices": OBJECT,
      "answer": STRING
    }
  ]
}

────────────────────────
VALIDASI SEBELUM OUTPUT
────────────────────────
- meta.total_questions == jumlah questions
- Semua question_ids ada di questions.id
- Semua type sesuai enum
- Tidak ada prompt kosong
- Tidak ada konflik jawaban
- JSON bisa langsung diparse tanpa error

Mulai hasilkan JSON sekarang.`
};

// Example JSON for each type
const EXAMPLE_JSON = {
  'Type A - Numerical Reasoning': `{
  "meta": {
    "title": "Tes IQ - Numerical Reasoning",
    "language": "id",
    "difficulty": "medium-high",
    "version": "1.0.0",
    "total_questions": 20,
    "recommended_time_minutes": 30,
    "scoring": {
      "correct_points": 1,
      "wrong_points": 0,
      "max_score": 20
    }
  },
  "sections": [
    {
      "id": "numerical",
      "name": "Numerical Reasoning",
      "question_ids": ["q1", "q2", "q3"]
    }
  ],
  "questions": [
    {
      "id": "q1",
      "type": "sequence",
      "prompt": "3, 8, 18, 38, 78, …",
      "choices": {
        "A": "158",
        "B": "148",
        "C": "138",
        "D": "128"
      },
      "answer": "A"
    }
  ]
}`,
  'Type B - Logical Reasoning': `{
  "meta": {
    "title": "Tes IQ - Logical Reasoning",
    "language": "id",
    "difficulty": "medium-high",
    "version": "1.0.0",
    "total_questions": 15,
    "recommended_time_minutes": 25,
    "scoring": {
      "correct_points": 1,
      "wrong_points": 0,
      "max_score": 15
    }
  },
  "sections": [
    {
      "id": "logical",
      "name": "Logical Reasoning",
      "question_ids": ["q1"]
    }
  ],
  "questions": [
    {
      "id": "q1",
      "type": "quantified_logic",
      "prompt": {
        "premises": [
          { "quantifier": "all", "subject": "kucing", "predicate": "hewan" },
          { "quantifier": "some", "subject": "hewan", "predicate": "bisa terbang" }
        ],
        "conclusion": { "quantifier": "some", "subject": "kucing", "predicate": "bisa terbang" }
      },
      "choices": {
        "A": "Benar",
        "B": "Salah",
        "C": "Tidak keduanya"
      },
      "answer": "C"
    }
  ]
}`,
  'Type C - Verbal Reasoning': `{
  "meta": {
    "title": "Tes IQ - Verbal Reasoning",
    "language": "id",
    "difficulty": "medium-high",
    "version": "1.0.0",
    "total_questions": 12,
    "recommended_time_minutes": 20,
    "scoring": {
      "correct_points": 1,
      "wrong_points": 0,
      "max_score": 12
    }
  },
  "sections": [
    {
      "id": "verbal",
      "name": "Verbal Reasoning",
      "question_ids": ["q1"]
    }
  ],
  "questions": [
    {
      "id": "q1",
      "type": "analogy",
      "prompt": "Susu : Gelas = Surat : ?",
      "choices": {
        "A": "Amplop",
        "B": "Pena",
        "C": "Kertas",
        "D": "Pos"
      },
      "answer": "A"
    }
  ]
}`,
  'Type D - Mixed IQ Test': `{
  "meta": {
    "title": "Tes IQ Komprehensif",
    "language": "id",
    "difficulty": "medium-high",
    "version": "1.0.0",
    "total_questions": 30,
    "recommended_time_minutes": 45,
    "scoring": {
      "correct_points": 1,
      "wrong_points": 0,
      "max_score": 30
    }
  },
  "sections": [
    {
      "id": "numerical",
      "name": "Numerical Reasoning",
      "question_ids": ["q1"]
    },
    {
      "id": "logical",
      "name": "Logical Reasoning",
      "question_ids": ["q2"]
    },
    {
      "id": "verbal",
      "name": "Verbal Reasoning",
      "question_ids": ["q3"]
    }
  ],
  "questions": [
    {
      "id": "q1",
      "type": "sequence",
      "prompt": "2, 6, 12, 20, 30, …",
      "choices": {
        "A": "42",
        "B": "40",
        "C": "38",
        "D": "36"
      },
      "answer": "A"
    }
  ]
}`
};

export default function QuizGeneratorPage() {
  const [selectedType, setSelectedType] = useState('Type A - Numerical Reasoning');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedExample, setCopiedExample] = useState(false);

  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(PROMPTS[selectedType]);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleCopyExample = async () => {
    await navigator.clipboard.writeText(EXAMPLE_JSON[selectedType]);
    setCopiedExample(true);
    setTimeout(() => setCopiedExample(false), 2000);
  };

  return (
    <PageContainer>
      <Link
        href="/quizzes"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Quizzes
      </Link>

      <PageHeader
        title="Quiz Generator"
        description="Generate IQ test quizzes using AI prompts"
      />

      {/* Info Card */}
      <Card className="mb-6 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                How to use this generator
              </p>
              <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                <li>Select a quiz type below</li>
                <li>Copy the prompt generator</li>
                <li>Paste it into ChatGPT, Claude, or any AI assistant</li>
                <li>The AI will generate a valid JSON quiz</li>
                <li>Upload the generated JSON to create your quiz</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Type Selection */}
      <div className="mb-6">
        <h3 className="text-sm font-medium mb-3">Select Quiz Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.keys(PROMPTS).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                selectedType === type
                  ? 'border-primary bg-primary/10'
                  : 'border-input hover:border-primary/50'
              }`}
            >
              <h4 className="font-semibold text-sm mb-1">{type}</h4>
              <p className="text-xs text-muted-foreground">
                {type.includes('Numerical') && '20 questions, 30 min'}
                {type.includes('Logical') && '15 questions, 25 min'}
                {type.includes('Verbal') && '12 questions, 20 min'}
                {type.includes('Mixed') && '30 questions, 45 min'}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prompt Generator */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Prompt Generator</CardTitle>
              <button
                onClick={handleCopyPrompt}
                className="inline-flex items-center gap-2 text-sm bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1.5 rounded transition-colors"
              >
                {copiedPrompt ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Prompt
                  </>
                )}
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg max-h-[600px] overflow-y-auto">
              <pre className="text-xs whitespace-pre-wrap font-mono">
                {PROMPTS[selectedType]}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Example JSON */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Example JSON Output</CardTitle>
              <button
                onClick={handleCopyExample}
                className="inline-flex items-center gap-2 text-sm bg-secondary hover:bg-secondary/80 px-3 py-1.5 rounded transition-colors"
              >
                {copiedExample ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <FileJson className="w-4 h-4" />
                    Copy Example
                  </>
                )}
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg max-h-[600px] overflow-y-auto">
              <pre className="text-xs whitespace-pre-wrap font-mono">
                {EXAMPLE_JSON[selectedType]}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Tips */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Tips for Best Results</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Use GPT-4 or Claude 3 for better quality questions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Validate the JSON output before uploading</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>You can regenerate if the output doesn't meet your standards</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Customize the prompt if you need specific topics or difficulty levels</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
