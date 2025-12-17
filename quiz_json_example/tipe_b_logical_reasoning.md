{
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
      "id": "sec_1",
      "name": "Logika Kuantifier",
      "question_ids": ["lr1", "lr2", "lr3", "lr4", "lr5", "lr6"]
    },
    {
      "id": "sec_2",
      "name": "Logika Proposisional",
      "question_ids": ["lr7", "lr8", "lr9", "lr10"]
    },
    {
      "id": "sec_3",
      "name": "Teka-teki Logika",
      "question_ids": ["lr11", "lr12", "lr13", "lr14", "lr15"]
    }
  ],
  "questions": [
    {
      "id": "lr1",
      "type": "quantified_logic",
      "prompt": {
        "premises": [
          {
            "quantifier": "all",
            "subject": "Grims",
            "predicate": "Fleks"
          },
          {
            "quantifier": "all",
            "subject": "Fleks",
            "predicate": "Zorps"
          }
        ],
        "conclusion": {
          "quantifier": "all",
          "subject": "Grims",
          "predicate": "Zorps"
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
      "id": "lr2",
      "type": "quantified_logic",
      "prompt": {
        "premises": [
          {
            "quantifier": "some",
            "subject": "Blins",
            "predicate": "Krops"
          },
          {
            "quantifier": "some",
            "subject": "Krops",
            "predicate": "Trels"
          }
        ],
        "conclusion": {
          "quantifier": "some",
          "subject": "Blins",
          "predicate": "Trels"
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
      "id": "lr3",
      "type": "quantified_logic",
      "prompt": {
        "premises": [
          {
            "quantifier": "all",
            "subject": "Vexes",
            "predicate": "Plorks"
          },
          {
            "quantifier": "none",
            "subject": "Plorks",
            "predicate": "Shrims"
          }
        ],
        "conclusion": {
          "quantifier": "none",
          "subject": "Vexes",
          "predicate": "Shrims"
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
      "id": "lr4",
      "type": "quantified_logic",
      "prompt": {
        "premises": [
          {
            "quantifier": "some",
            "subject": "Throps",
            "predicate": "Dlinks"
          },
          {
            "quantifier": "none",
            "subject": "Dlinks",
            "predicate": "Wrels"
          }
        ],
        "conclusion": {
          "quantifier": "some",
          "subject": "Throps",
          "predicate": "Wrels"
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
      "id": "lr5",
      "type": "quantified_logic",
      "prompt": {
        "premises": [
          {
            "quantifier": "all",
            "subject": "Snurks",
            "predicate": "Gleps"
          },
          {
            "quantifier": "some",
            "subject": "Gleps",
            "predicate": "Frems"
          }
        ],
        "conclusion": {
          "quantifier": "some",
          "subject": "Snurks",
          "predicate": "Frems"
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
      "id": "lr6",
      "type": "quantified_logic",
      "prompt": {
        "premises": [
          {
            "quantifier": "none",
            "subject": "Cliks",
            "predicate": "Blorps"
          },
          {
            "quantifier": "all",
            "subject": "Blorps",
            "predicate": "Vinks"
          }
        ],
        "conclusion": {
          "quantifier": "none",
          "subject": "Cliks",
          "predicate": "Vinks"
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
      "id": "lr7",
      "type": "propositional_logic",
      "prompt": {
        "premises": [
          "P → Q",
          "Q → R",
          "¬R"
        ],
        "question": "Apa yang pasti benar?"
      },
      "choices": {
        "a": "P benar",
        "b": "Q benar",
        "c": "P salah",
        "d": "Tidak ada yang pasti"
      },
      "answer": "c"
    },
    {
      "id": "lr8",
      "type": "propositional_logic",
      "prompt": {
        "premises": [
          "P ∨ Q",
          "¬P",
          "Q → R"
        ],
        "question": "Apa yang pasti benar?"
      },
      "choices": {
        "a": "R benar",
        "b": "R salah",
        "c": "P benar",
        "d": "Q salah"
      },
      "answer": "a"
    },
    {
      "id": "lr9",
      "type": "propositional_logic",
      "prompt": {
        "premises": [
          "P ∧ Q",
          "P → R",
          "Q → S"
        ],
        "question": "Apa yang pasti benar?"
      },
      "choices": {
        "a": "R ∧ S",
        "b": "R ∨ S",
        "c": "¬R ∨ ¬S",
        "d": "Tidak ada yang pasti"
      },
      "answer": "a"
    },
    {
      "id": "lr10",
      "type": "propositional_logic",
      "prompt": {
        "premises": [
          "P → Q",
          "R → S",
          "P ∨ R",
          "¬Q"
        ],
        "question": "Apa yang pasti benar?"
      },
      "choices": {
        "a": "S benar",
        "b": "R salah",
        "c": "P benar",
        "d": "Q benar"
      },
      "answer": "a"
    },
    {
      "id": "lr11",
      "type": "logic_puzzle",
      "prompt": {
        "setup": "Tiga orang: Ani, Budi, Citra. Tepat satu orang berbohong, dua lainnya jujur.",
        "statements": {
          "Ani": "Budi berbohong",
          "Budi": "Citra jujur",
          "Citra": "Ani berbohong"
        },
        "constraint": "Siapa yang berbohong?"
      },
      "choices": {
        "a": "Ani",
        "b": "Budi",
        "c": "Citra",
        "d": "Tidak dapat ditentukan"
      },
      "answer": "a"
    },
    {
      "id": "lr12",
      "type": "logic_puzzle",
      "prompt": {
        "setup": "Empat orang duduk berurutan: P, Q, R, S. P tidak di ujung. R di sebelah kiri S.",
        "statements": {
          "Fakta 1": "Q tidak bersebelahan dengan P",
          "Fakta 2": "S di posisi paling kanan"
        },
        "constraint": "Siapa yang duduk paling kiri?"
      },
      "choices": {
        "a": "P",
        "b": "Q",
        "c": "R",
        "d": "Tidak dapat ditentukan"
      },
      "answer": "b"
    },
    {
      "id": "lr13",
      "type": "logic_puzzle",
      "prompt": {
        "setup": "Lima kotak: A, B, C, D, E. Tepat satu berisi hadiah. Setiap kotak punya label, tepat satu label benar.",
        "statements": {
          "A": "Hadiah ada di B",
          "B": "Hadiah tidak ada di A",
          "C": "Hadiah ada di sini",
          "D": "Hadiah tidak ada di C",
          "E": "Hadiah ada di D"
        },
        "constraint": "Di mana hadiah berada?"
      },
      "choices": {
        "a": "A",
        "b": "B",
        "c": "C",
        "d": "D"
      },
      "answer": "d"
    },
    {
      "id": "lr14",
      "type": "logic_puzzle",
      "prompt": {
        "setup": "Tiga saudara: X, Y, Z. Salah satu selalu jujur, satu selalu bohong, satu acak.",
        "statements": {
          "X": "Y adalah pembohong",
          "Y": "Z acak",
          "Z": "X jujur"
        },
        "constraint": "Siapa yang selalu jujur?"
      },
      "choices": {
        "a": "X",
        "b": "Y",
        "c": "Z",
        "d": "Tidak dapat ditentukan"
      },
      "answer": "c"
    },
    {
      "id": "lr15",
      "type": "logic_puzzle",
      "prompt": {
        "setup": "Empat atlet berlomba: J, K, L, M. Tidak ada yang finish bersamaan.",
        "statements": {
          "Fakta 1": "J finish sebelum K",
          "Fakta 2": "L finish setelah K tetapi sebelum M",
          "Fakta 3": "M bukan yang terakhir"
        },
        "constraint": "Siapa yang finish pertama?"
      },
      "choices": {
        "a": "J",
        "b": "K",
        "c": "L",
        "d": "Tidak mungkin"
      },
      "answer": "d"
    }
  ]
}