export interface SampleCase {
  id: string;
  name: string;
  description: string;
  dev: any;
  stage: any;
}

export const SAMPLE_CASES: SampleCase[] = [
  {
    id: "etds_tax_return",
    name: "ETDS Tax Return Assessment (Mismatch)",
    description: "Realistic ETDS tax return API payload showing missing fields, rate disparities, and array ordering.",
    dev: {
      status: "SUCCESS",
      code: 200,
      timestamp: "2026-10-05T06:30:00Z",
      data: {
        assessment_year: "2026-2027",
        taxpayer: {
          tin: "482910394812",
          name: "Mohammad Ashikur Rahman",
          circle: "Circle-044, Taxes Zone-03, Dhaka",
          status: "Individual",
          is_filer: true,
          phone: "+8801712345678"
        },
        income_sources: [
          {
            id: "inc_01",
            sector: "Salaries (Sec 32)",
            gross_amount: 1200000,
            exempted_amount: 400000,
            taxable_amount: 800000
          },
          {
            id: "inc_02",
            sector: "Interest on Securities (Sec 22)",
            gross_amount: 150000,
            exempted_amount: 0,
            taxable_amount: 150000
          }
        ],
        tax_computation: {
          total_taxable_income: 950000,
          gross_tax_liability: 67500,
          rebate_amount: 15000,
          net_tax_payable: 52500,
          minimum_tax: 5000,
          tax_deducted_at_source: 45000,
          payable_with_return: 7500
        },
        meta: {
          version: "v2.4.1",
          processing_time_ms: 42
        }
      }
    },
    stage: {
      status: "SUCCESS",
      code: 200,
      timestamp: "2026-10-05T06:30:00Z",
      data: {
        assessment_year: "2026-2027",
        taxpayer: {
          tin: "482910394812",
          name: "Mohammad Ashikur Rahman",
          circle: "Circle-044, Taxes Zone-03, Dhaka",
          status: "Individual",
          is_filer: "true", // Type mismatch: string instead of boolean
          // Missing phone in stage
          nid: "1992269300001" // Extra field in stage
        },
        // Same items but different array order (tests Ignore Array Ordering!)
        income_sources: [
          {
            id: "inc_02",
            sector: "Interest on Securities (Sec 22)",
            gross_amount: 150000,
            exempted_amount: 0,
            taxable_amount: 150000
          },
          {
            id: "inc_01",
            sector: "Salaries (Sec 32)",
            gross_amount: 1200000,
            exempted_amount: 400000,
            taxable_amount: 800000
          }
        ],
        tax_computation: {
          total_taxable_income: 950000,
          gross_tax_liability: 70000, // Value mismatch (70000 vs 67500)
          rebate_amount: 15000,
          net_tax_payable: 55000, // Value mismatch (55000 vs 52500)
          minimum_tax: 5000,
          tax_deducted_at_source: 45000,
          payable_with_return: 10000 // Value mismatch
        },
        meta: {
          version: "v2.5.0-rc1", // Value mismatch
          processing_time_ms: 38,
          debug_trace_id: "stg-srv-node-883" // Extra field in stage
        }
      }
    }
  },
  {
    id: "etds_challan_verification",
    name: "ETDS Challan Verification (Sensitive Field Leak)",
    description: "Challan deposit verification with debug info leakage and payment status differences.",
    dev: {
      challan_no: "CH-2026-09817",
      bank_code: "SONALI_0041",
      branch: "Ramna Corporate Branch",
      amount_bdt: 25000.0,
      challan_date: "2026-09-28",
      verified: true,
      status: "SETTLED"
    },
    stage: {
      challan_no: "CH-2026-09817",
      bank_code: "SONALI_0041",
      branch: "Ramna Corporate Branch",
      amount_bdt: 25000.0,
      challan_date: "2026-09-28",
      verified: true,
      status: "PENDING_SETTLEMENT", // Value mismatch
      db_query_time_ms: 12.4, // Extra in stage
      internal_jwt_secret: "secret-token-leak-in-stage" // Extra sensitive in stage
    }
  },
  {
    id: "perfect_match",
    name: "100% Identical Payloads (Matched / OK)",
    description: "Identical responses with slightly different key ordering or array sequences to verify zero-diff matching.",
    dev: {
      status: "SUCCESS",
      data: {
        user_id: 1049,
        username: "qa_engineer_nbr",
        permissions: ["read:tax", "write:challan", "export:report"],
        settings: {
          theme: "dark",
          auto_save: true,
          pagination_size: 50
        }
      }
    },
    stage: {
      status: "SUCCESS",
      data: {
        settings: {
          pagination_size: 50,
          theme: "dark",
          auto_save: true
        },
        username: "qa_engineer_nbr",
        user_id: 1049,
        permissions: ["write:challan", "export:report", "read:tax"]
      }
    }
  }
];
