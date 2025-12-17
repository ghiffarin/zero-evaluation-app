{
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
      "id": "sec_1",
      "name": "Deret Bilangan",
      "question_ids": ["nr1", "nr2", "nr3", "nr4", "nr5", "nr6"]
    },
    {
      "id": "sec_2",
      "name": "Pemetaan Fungsi",
      "question_ids": ["nr7", "nr8", "nr9"]
    },
    {
      "id": "sec_3",
      "name": "Matriks Numerik",
      "question_ids": ["nr10", "nr11", "nr12", "nr13"]
    },
    {
      "id": "sec_4",
      "name": "Operator Khusus",
      "question_ids": ["nr14", "nr15", "nr16"]
    },
    {
      "id": "sec_5",
      "name": "Rekurensi",
      "question_ids": ["nr17", "nr18"]
    },
    {
      "id": "sec_6",
      "name": "Soal Cerita Aritmatika",
      "question_ids": ["nr19", "nr20"]
    }
  ],
  "questions": [
    {
      "id": "nr1",
      "type": "sequence",
      "prompt": "5, 10, 20, 40, 80, …",
      "choices": {
        "a": "120",
        "b": "140",
        "c": "160",
        "d": "180"
      },
      "answer": "c"
    },
    {
      "id": "nr2",
      "type": "sequence",
      "prompt": "1, 3, 7, 15, 31, …",
      "choices": {
        "a": "47",
        "b": "55",
        "c": "63",
        "d": "71"
      },
      "answer": "c"
    },
    {
      "id": "nr3",
      "type": "sequence",
      "prompt": "2, 6, 14, 30, 62, …",
      "choices": {
        "a": "94",
        "b": "110",
        "c": "126",
        "d": "142"
      },
      "answer": "c"
    },
    {
      "id": "nr4",
      "type": "sequence",
      "prompt": "100, 50, 25, 12.5, 6.25, …",
      "choices": {
        "a": "2.5",
        "b": "3.125",
        "c": "4",
        "d": "5"
      },
      "answer": "b"
    },
    {
      "id": "nr5",
      "type": "sequence",
      "prompt": "3, 5, 9, 17, 33, …",
      "choices": {
        "a": "49",
        "b": "57",
        "c": "65",
        "d": "73"
      },
      "answer": "c"
    },
    {
      "id": "nr6",
      "type": "sequence",
      "prompt": "1, 4, 10, 22, 46, …",
      "choices": {
        "a": "82",
        "b": "86",
        "c": "94",
        "d": "102"
      },
      "answer": "c"
    },
    {
      "id": "nr7",
      "type": "mapping",
      "prompt": "2 ↦ 9, 4 ↦ 25, 6 ↦ 49, 8 ↦ ?",
      "choices": {
        "a": "64",
        "b": "72",
        "c": "81",
        "d": "100"
      },
      "answer": "c"
    },
    {
      "id": "nr8",
      "type": "mapping",
      "prompt": "3 ↦ 11, 5 ↦ 27, 7 ↦ 51, 9 ↦ ?",
      "choices": {
        "a": "75",
        "b": "83",
        "c": "91",
        "d": "99"
      },
      "answer": "b"
    },
    {
      "id": "nr9",
      "type": "mapping",
      "prompt": "1 ↦ 2, 2 ↦ 9, 3 ↦ 28, 4 ↦ 65, 5 ↦ ?",
      "choices": {
        "a": "102",
        "b": "126",
        "c": "145",
        "d": "156"
      },
      "answer": "b"
    },
    {
      "id": "nr10",
      "type": "matrix",
      "prompt": [
        [3, 6, 18],
        [4, 8, 32],
        [5, 10, null]
      ],
      "choices": {
        "a": "40",
        "b": "45",
        "c": "50",
        "d": "55"
      },
      "answer": "c"
    },
    {
      "id": "nr11",
      "type": "matrix",
      "prompt": [
        [2, 5, 7],
        [3, 8, 11],
        [4, 11, null]
      ],
      "choices": {
        "a": "13",
        "b": "14",
        "c": "15",
        "d": "16"
      },
      "answer": "c"
    },
    {
      "id": "nr12",
      "type": "matrix",
      "prompt": [
        [4, 3, 12],
        [6, 5, 30],
        [8, 7, null]
      ],
      "choices": {
        "a": "48",
        "b": "52",
        "c": "56",
        "d": "60"
      },
      "answer": "c"
    },
    {
      "id": "nr13",
      "type": "matrix",
      "prompt": [
        [9, 3, 3],
        [16, 4, 4],
        [25, null, 5]
      ],
      "choices": {
        "a": "3",
        "b": "4",
        "c": "5",
        "d": "6"
      },
      "answer": "c"
    },
    {
      "id": "nr14",
      "type": "custom_operator",
      "definition": "a ★ b = 3a + 2b",
      "prompt": "Jika 5 ★ 4 = 23, maka 7 ★ 6 = ?",
      "choices": {
        "a": "31",
        "b": "33",
        "c": "35",
        "d": "37"
      },
      "answer": "b"
    },
    {
      "id": "nr15",
      "type": "custom_operator",
      "definition": "a ◆ b = a² + b",
      "prompt": "Jika 4 ◆ 3 = 19, maka 6 ◆ 5 = ?",
      "choices": {
        "a": "38",
        "b": "39",
        "c": "40",
        "d": "41"
      },
      "answer": "d"
    },
    {
      "id": "nr16",
      "type": "custom_operator",
      "definition": "a ▲ b = (a + b) × a",
      "prompt": "3 ▲ 5 = ?",
      "choices": {
        "a": "16",
        "b": "20",
        "c": "24",
        "d": "28"
      },
      "answer": "c"
    },
    {
      "id": "nr17",
      "type": "recurrence",
      "prompt": "f(1) = 3, f(n) = 2f(n-1) + 1. Nilai f(4) = ?",
      "choices": {
        "a": "25",
        "b": "27",
        "c": "29",
        "d": "31"
      },
      "answer": "d"
    },
    {
      "id": "nr18",
      "type": "recurrence",
      "prompt": "g(1) = 2, g(2) = 5, g(n) = g(n-1) + g(n-2) + 1. Nilai g(4) = ?",
      "choices": {
        "a": "13",
        "b": "14",
        "c": "15",
        "d": "16"
      },
      "answer": "c"
    },
    {
      "id": "nr19",
      "type": "arithmetic_word",
      "prompt": "Sebuah tangki dapat diisi penuh oleh pipa A dalam 6 jam, dan oleh pipa B dalam 9 jam. Jika kedua pipa dibuka bersamaan, berapa jam tangki akan penuh?",
      "choices": {
        "a": "3.0 jam",
        "b": "3.6 jam",
        "c": "4.2 jam",
        "d": "4.5 jam"
      },
      "answer": "b"
    },
    {
      "id": "nr20",
      "type": "arithmetic_word",
      "prompt": "Harga barang setelah diskon 20% adalah 320. Berapa harga barang sebelum diskon?",
      "choices": {
        "a": "360",
        "b": "380",
        "c": "400",
        "d": "420"
      },
      "answer": "c"
    }
  ]
}