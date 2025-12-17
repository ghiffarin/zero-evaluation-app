{
  "meta": {
    "title": "Tes IQ Komprehensif - Fluid Intelligence",
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
      "id": "sec_1",
      "name": "Penalaran Numerik",
      "question_ids": ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10", "q11", "q12", "q13", "q14"]
    },
    {
      "id": "sec_2",
      "name": "Penalaran Logis",
      "question_ids": ["q15", "q16", "q17", "q18", "q19", "q20", "q21", "q22", "q23"]
    },
    {
      "id": "sec_3",
      "name": "Penalaran Verbal",
      "question_ids": ["q24", "q25", "q26", "q27", "q28", "q29", "q30"]
    }
  ],
  "questions": [
    {
      "id": "q1",
      "type": "sequence",
      "prompt": "3, 9, 27, 81, 243, …",
      "choices": {
        "a": "486",
        "b": "567",
        "c": "729",
        "d": "810"
      },
      "answer": "c"
    },
    {
      "id": "q2",
      "type": "sequence",
      "prompt": "2, 5, 10, 17, 26, …",
      "choices": {
        "a": "35",
        "b": "37",
        "c": "39",
        "d": "41"
      },
      "answer": "b"
    },
    {
      "id": "q3",
      "type": "mapping",
      "prompt": "4 ↦ 18, 6 ↦ 38, 8 ↦ 66, 10 ↦ ?",
      "choices": {
        "a": "94",
        "b": "98",
        "c": "102",
        "d": "106"
      },
      "answer": "c"
    },
    {
      "id": "q4",
      "type": "matrix",
      "prompt": [
        [2, 3, 6],
        [4, 5, 20],
        [6, 7, null]
      ],
      "choices": {
        "a": "36",
        "b": "40",
        "c": "42",
        "d": "48"
      },
      "answer": "c"
    },
    {
      "id": "q5",
      "type": "custom_operator",
      "definition": "a ● b = (a × b) + a - b",
      "prompt": "5 ● 3 = ?",
      "choices": {
        "a": "15",
        "b": "17",
        "c": "19",
        "d": "21"
      },
      "answer": "b"
    },
    {
      "id": "q6",
      "type": "sequence",
      "prompt": "1, 2, 4, 7, 11, 16, …",
      "choices": {
        "a": "20",
        "b": "21",
        "c": "22",
        "d": "23"
      },
      "answer": "c"
    },
    {
      "id": "q7",
      "type": "mapping",
      "prompt": "2 ↦ 5, 3 ↦ 10, 4 ↦ 17, 5 ↦ ?",
      "choices": {
        "a": "24",
        "b": "25",
        "c": "26",
        "d": "28"
      },
      "answer": "c"
    },
    {
      "id": "q8",
      "type": "matrix",
      "prompt": [
        [5, 2, 10],
        [7, 3, 21],
        [9, 4, null]
      ],
      "choices": {
        "a": "32",
        "b": "34",
        "c": "36",
        "d": "38"
      },
      "answer": "c"
    },
    {
      "id": "q9",
      "type": "recurrence",
      "prompt": "f(1) = 5, f(n) = 2f(n-1) - 3. Nilai f(4) = ?",
      "choices": {
        "a": "11",
        "b": "13",
        "c": "15",
        "d": "17"
      },
      "answer": "a"
    },
    {
      "id": "q10",
      "type": "sequence",
      "prompt": "5, 8, 14, 26, 50, …",
      "choices": {
        "a": "86",
        "b": "92",
        "c": "98",
        "d": "104"
      },
      "answer": "c"
    },
    {
      "id": "q11",
      "type": "custom_operator",
      "definition": "a ◇ b = a² - 2b",
      "prompt": "Jika 6 ◇ x = 28, maka x = ?",
      "choices": {
        "a": "2",
        "b": "3",
        "c": "4",
        "d": "5"
      },
      "answer": "c"
    },
    {
      "id": "q12",
      "type": "matrix",
      "prompt": [
        [1, 4, 5],
        [2, 5, 7],
        [3, 6, null]
      ],
      "choices": {
        "a": "8",
        "b": "9",
        "c": "10",
        "d": "11"
      },
      "answer": "b"
    },
    {
      "id": "q13",
      "type": "arithmetic_word",
      "prompt": "Sebuah mobil menempuh jarak 240 km dalam 3 jam. Jika kecepatannya ditingkatkan 20 km/jam, berapa waktu yang dibutuhkan untuk jarak yang sama?",
      "choices": {
        "a": "2 jam",
        "b": "2.4 jam",
        "c": "2.5 jam",
        "d": "3 jam"
      },
      "answer": "b"
    },
    {
      "id": "q14",
      "type": "recurrence",
      "prompt": "g(1) = 3, g(2) = 7, g(n) = g(n-1) + 2g(n-2). Nilai g(4) = ?",
      "choices": {
        "a": "23",
        "b": "25",
        "c": "27",
        "d": "29"
      },
      "answer": "d"
    },
    {
      "id": "q15",
      "type": "quantified_logic",
      "prompt": {
        "premises": [
          {
            "quantifier": "all",
            "subject": "Krims",
            "predicate": "Blops"
          },
          {
            "quantifier": "all",
            "subject": "Blops",
            "predicate": "Trels"
          }
        ],
        "conclusion": {
          "quantifier": "all",
          "subject": "Krims",
          "predicate": "Trels"
        }
      },
      "choices": {
        "A": "Benar",
        "B": "Salah",
        "C": "Tidak keduanya"
      },
      "answer": "A"
    },
    {
      "id": "q16",
      "type": "propositional_logic",
      "prompt": {
        "premises": [
          "P → Q",
          "Q → R",
          "P"
        ],
        "question": "Apa yang pasti benar?"
      },
      "choices": {
        "a": "R benar",
        "b": "R salah",
        "c": "Q salah",
        "d": "Tidak ada yang pasti"
      },
      "answer": "a"
    },
    {
      "id": "q17",
      "type": "quantified_logic",
      "prompt": {
        "premises": [
          {
            "quantifier": "some",
            "subject": "Vexes",
            "predicate": "Plinks"
          },
          {
            "quantifier": "none",
            "subject": "Plinks",
            "predicate": "Shrops"
          }
        ],
        "conclusion": {
          "quantifier": "some",
          "subject": "Vexes",
          "predicate": "Shrops"
        }
      },
      "choices": {
        "A": "Benar",
        "B": "Salah",
        "C": "Tidak keduanya"
      },
      "answer": "B"
    },
    {
      "id": "q18",
      "type": "logic_puzzle",
      "prompt": {
        "setup": "Tiga orang: Doni, Eko, Fani. Tepat satu berbohong.",
        "statements": {
          "Doni": "Eko berbohong",
          "Eko": "Fani jujur",
          "Fani": "Doni jujur"
        },
        "constraint": "Siapa yang berbohong?"
      },
      "choices": {
        "a": "Doni",
        "b": "Eko",
        "c": "Fani",
        "d": "Tidak dapat ditentukan"
      },
      "answer": "a"
    },
    {
      "id": "q19",
      "type": "propositional_logic",
      "prompt": {
        "premises": [
          "P ∨ Q",
          "¬Q",
          "P → R"
        ],
        "question": "Apa yang pasti benar?"
      },
      "choices": {
        "a": "P salah",
        "b": "R benar",
        "c": "Q benar",
        "d": "R salah"
      },
      "answer": "b"
    },
    {
      "id": "q20",
      "type": "quantified_logic",
      "prompt": {
        "premises": [
          {
            "quantifier": "all",
            "subject": "Snirks",
            "predicate": "Glems"
          },
          {
            "quantifier": "some",
            "subject": "Glems",
            "predicate": "Wrens"
          }
        ],
        "conclusion": {
          "quantifier": "some",
          "subject": "Snirks",
          "predicate": "Wrens"
        }
      },
      "choices": {
        "A": "Benar",
        "B": "Salah",
        "C": "Tidak keduanya"
      },
      "answer": "C"
    },
    {
      "id": "q21",
      "type": "logic_puzzle",
      "prompt": {
        "setup": "Empat kotak: W, X, Y, Z. Tepat satu berisi koin. Setiap label hanya satu yang benar.",
        "statements": {
          "W": "Koin ada di X",
          "X": "Koin tidak di W",
          "Y": "Koin ada di sini",
          "Z": "Koin tidak di Y"
        },
        "constraint": "Di mana koin berada?"
      },
      "choices": {
        "a": "W",
        "b": "X",
        "c": "Y",
        "d": "Z"
      },
      "answer": "c"
    },
    {
      "id": "q22",
      "type": "propositional_logic",
      "prompt": {
        "premises": [
          "P ∧ Q",
          "Q → R",
          "R → S"
        ],
        "question": "Apa yang pasti benar?"
      },
      "choices": {
        "a": "S benar",
        "b": "S salah",
        "c": "P salah",
        "d": "R salah"
      },
      "answer": "a"
    },
    {
      "id": "q23",
      "type": "logic_puzzle",
      "prompt": {
        "setup": "Lima orang berurutan: A, B, C, D, E. C tidak di ujung. D di sebelah kanan C.",
        "statements": {
          "Fakta 1": "A tidak bersebelahan dengan B",
          "Fakta 2": "E di posisi paling kiri"
        },
        "constraint": "Siapa yang di posisi tengah?"
      },
      "choices": {
        "a": "B",
        "b": "C",
        "c": "D",
        "d": "Tidak dapat ditentukan"
      },
      "answer": "b"
    },
    {
      "id": "q24",
      "type": "analogy",
      "prompt": "Pena : Kertas = Kuas : ?",
      "choices": {
        "a": "Lukisan",
        "b": "Kanvas",
        "c": "Cat",
        "d": "Seniman"
      },
      "answer": "b"
    },
    {
      "id": "q25",
      "type": "classification",
      "prompt": "Manakah yang TIDAK termasuk kelompok berikut?",
      "choices": {
        "a": "Apel",
        "b": "Jeruk",
        "c": "Mangga",
        "d": "Tomat"
      },
      "answer": "d"
    },
    {
      "id": "q26",
      "type": "analogy",
      "prompt": "Jam : Waktu = Termometer : ?",
      "choices": {
        "a": "Suhu",
        "b": "Panas",
        "c": "Air",
        "d": "Raksa"
      },
      "answer": "a"
    },
    {
      "id": "q27",
      "type": "symbol_encoding",
      "prompt": {
        "example": "SIANG → TJAOH",
        "rule_hint": "Perhatikan perubahan setiap huruf",
        "question": "BUMI → ?"
      },
      "choices": {
        "a": "CVNJ",
        "b": "CWNJ",
        "c": "CVMJ",
        "d": "BVNJ"
      },
      "answer": "a"
    },
    {
      "id": "q28",
      "type": "classification",
      "prompt": "Manakah yang TIDAK termasuk kelompok berikut?",
      "choices": {
        "a": "Sendok",
        "b": "Garpu",
        "c": "Pisau",
        "d": "Piring"
      },
      "answer": "d"
    },
    {
      "id": "q29",
      "type": "analogy",
      "prompt": "Kepala : Topi = Kaki : ?",
      "choices": {
        "a": "Jalan",
        "b": "Sepatu",
        "c": "Kaus Kaki",
        "d": "Tanah"
      },
      "answer": "b"
    },
    {
      "id": "q30",
      "type": "symbol_encoding",
      "prompt": {
        "example": "BACA → ACAB",
        "rule_hint": "Perhatikan urutan kata",
        "question": "TEMAN → ?"
      },
      "choices": {
        "a": "NAMET",
        "b": "MANET",
        "c": "ATMEN",
        "d": "TENAM"
      },
      "answer": "a"
    }
  ]
}