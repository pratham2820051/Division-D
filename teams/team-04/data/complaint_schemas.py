# Complaint Schemas and Domain Knowledge

DOMAIN_SCHEMAS = {
    "e-commerce": {
        "display_name": "E-Commerce / Online Shopping",
        "description": "Complaints regarding online shopping, non-delivery, damaged goods, refund denials, fake products, or misleading descriptions on online platforms.",
        "required_entities": {
            "complainant_name": "Full name of the consumer",
            "complainant_address": "Residential address of the consumer",
            "complainant_email": "Email of the consumer",
            "complainant_phone": "Phone number of the consumer",
            "respondent_name": "Name of the e-commerce company (e.g., Amazon India, Flipkart, etc.)",
            "respondent_address": "Registered office address of the company",
            "order_id": "Order ID / Transaction Reference",
            "order_date": "Date of order (YYYY-MM-DD)",
            "transaction_amount": "Total amount paid (in ₹)",
            "product_name": "Name of the product purchased",
            "grievance_date": "Date when the issue occurred (e.g., date of delivery or date when refund was refused)",
            "defect_details": "Description of the defect or service deficiency (e.g., product not delivered, sent damaged, wrong item, refund refused)"
        },
        "guided_questions": [
            "What is your full name, address, and contact details?",
            "What is the name of the E-Commerce platform and their registered office address?",
            "What did you purchase, what was the Order ID, and when did you order it?",
            "How much did you pay for the item?",
            "What went wrong? (e.g., did the product arrive damaged, was it a fake product, or did they refuse to refund your money?)",
            "When did you contact their customer support, and what was their response?"
        ],
        "evidence_checklist": [
            "Order Confirmation Email or Screenshot",
            "Invoice showing details of the transaction and amount paid",
            "Proof of Payment (Bank Statement / UPI Receipt / Credit Card Statement)",
            "Photographs of the product received (especially if damaged, fake, or different)",
            "Unboxing Video (if available, which is strong evidence for e-commerce disputes)",
            "Copy of communications (Emails, Chat transcripts, Support tickets) with Customer Care",
            "Legal notice sent to the platform (if any) along with proof of delivery"
        ],
        "confonet_template_reference": {
            "title": "Grievance against E-commerce platform for defective delivery/refund refusal",
            "legal_grounds": [
                "The Respondent has committed a deficiency in service under Section 2(11) by failing to deliver goods as described.",
                "The action of the Respondent in delivering a damaged/spurious product and subsequently refusing a refund constitutes an Unfair Trade Practice under Section 2(47) of the CPA, 2019."
            ]
        }
    },
    "banking": {
        "display_name": "Banking & Financial Services",
        "description": "Complaints regarding unauthorized transactions, hidden charges, loan processing issues, non-reversal of failed ATM transactions, or credit card billing disputes.",
        "required_entities": {
            "complainant_name": "Full name of the consumer",
            "complainant_address": "Residential address of the consumer",
            "complainant_email": "Email of the consumer",
            "complainant_phone": "Phone number of the consumer",
            "respondent_name": "Name of the Bank / Financial Institution (e.g., SBI, HDFC Bank, etc.)",
            "respondent_address": "Registered office/branch address of the bank",
            "account_number": "Bank Account or Credit Card or Loan Account number",
            "transaction_id": "Transaction Reference / UPI ID / ATM ID",
            "transaction_date": "Date of transaction or event (YYYY-MM-DD)",
            "transaction_amount": "Disputed amount (in ₹)",
            "grievance_date": "Date when the dispute arose / bank rejected the complaint",
            "defect_details": "Description of the banking grievance (e.g., unauthorized debit, ATM failed but debited, credit card overcharged, insurance mis-sold)"
        },
        "guided_questions": [
            "What is your full name, address, and contact details?",
            "What is the name of the Bank or Financial Institution and the specific branch address where you hold the account/card?",
            "What is your Account Number, Credit Card Number, or Loan Account Number?",
            "When did the incident occur, and what is the disputed amount?",
            "Can you describe the problem? (e.g., did an ATM fail to dispense cash but debited your account, or were there unauthorized online transactions?)",
            "Did you file a complaint with the bank's Grievance Redressal Officer or Banking Ombudsman, and when? What was their final response?"
        ],
        "evidence_checklist": [
            "Bank Account Statement / Credit Card Statement highlighting the disputed transaction",
            "ATM slip showing 'Transaction Failed' or withdrawal error message (if applicable)",
            "Copy of written complaint submitted to the Branch Manager",
            "Acknowledgment copy of the complaint with date and stamp",
            "Correspondence/Emails from the bank rejecting the claim or failing to resolve it within 30 days",
            "Copy of complaint filed with the RBI Banking Ombudsman and the Ombudsman's decision (if any)",
            "SMS alerts received from the bank regarding the transaction"
        ],
        "confonet_template_reference": {
            "title": "Grievance against Bank for unauthorized debit / failed ATM transaction / deficiency in service",
            "legal_grounds": [
                "The Respondent Bank is guilty of deficiency in service under Section 2(11) of the CPA 2019 for failing to reverse the unauthorized debit / failed ATM transaction within the RBI-mandated timeline (T+5 days).",
                "The bank failed in its duty of care and security protocols, leading to financial loss and mental distress to the Complainant."
            ]
        }
    },
    "telecom": {
        "display_name": "Telecom & Internet Services",
        "description": "Complaints regarding wrongful billing, frequent network outages, unauthorized subscription activations, non-refund of security deposit, or denial of number portability.",
        "required_entities": {
            "complainant_name": "Full name of the consumer",
            "complainant_address": "Residential address of the consumer",
            "complainant_email": "Email of the consumer",
            "complainant_phone": "Phone number of the consumer",
            "respondent_name": "Name of the Telecom Operator (e.g., Reliance Jio, Airtel, Vi, BSNL)",
            "respondent_address": "Registered office/nodal office address of the operator",
            "mobile_number": "Disputed Mobile Number / Broadband Connection ID",
            "bill_number": "Invoice / Bill Number (if billing issue)",
            "disputed_amount": "Disputed amount or deposit (in ₹)",
            "grievance_date": "Date of incident or bill date",
            "defect_details": "Description of the telecom grievance (e.g., overbilling, no network service for weeks, security deposit not refunded, activation of VAS without consent)"
        },
        "guided_questions": [
            "What is your full name, address, and contact details?",
            "What is the name of the Telecom Operator and their nodal/registered address?",
            "What is your mobile number or broadband connection ID?",
            "What is the core issue? (e.g., are they billing you for services you never used, refusing to refund a security deposit, or has the service been down for a long time?)",
            "What is the disputed amount, and when did the issue start?",
            "What is the Docket Number / Complaint ID you received from their customer care or Appellate Authority, and what was their decision?"
        ],
        "evidence_checklist": [
            "Copy of the disputed bills / invoices",
            "Payment receipts for the bills or security deposits",
            "Docket Numbers/Complaint registration SMS/Email from the telecom operator",
            "Screenshots of speed tests or network outage reports (if internet service quality dispute)",
            "Copy of communication sent to the Nodal Officer / Appellate Authority of the operator",
            "TRAI consumer complaint registration details or correspondence (if any)",
            "Service Agreement / Terms of Service copy"
        ],
        "confonet_template_reference": {
            "title": "Grievance against Telecom Provider for wrongful billing and deficiency in service",
            "legal_grounds": [
                "The Respondent's failure to provide active services despite timely payment of monthly bills constitutes a breach of service agreement and deficiency in service.",
                "Charging for un-activated Value Added Services (VAS) without explicit consent violates TRAI regulations and constitutes an unfair trade practice under Section 2(47)."
            ]
        }
    },
    "food": {
        "display_name": "Food Safety & Restaurant Services",
        "description": "Complaints regarding adulterated food, foreign objects in food, food poisoning from restaurants/deliveries, selling expired products, or charging above MRP.",
        "required_entities": {
            "complainant_name": "Full name of the consumer",
            "complainant_address": "Residential address of the consumer",
            "complainant_email": "Email of the consumer",
            "complainant_phone": "Phone number of the consumer",
            "respondent_name": "Name of the Restaurant / Food Outlet / Manufacturer (e.g., Zomato partner restaurant, Nestle, etc.)",
            "respondent_address": "Address of the restaurant outlet or registered office of manufacturer",
            "bill_number": "Food Bill / Order ID / Invoice Number",
            "purchase_date": "Date of purchase or consumption (YYYY-MM-DD)",
            "transaction_amount": "Amount spent on the food item (in ₹)",
            "food_item_name": "Name of the food item / product",
            "grievance_date": "Date when health issue occurred / complaint was raised",
            "defect_details": "Description of the food safety issue (e.g., cockroach found in food, severe food poisoning leading to hospitalization, expired product sold)"
        },
        "guided_questions": [
            "What is your full name, address, and contact details?",
            "What is the name and address of the Restaurant, Food Outlet, or Manufacturer?",
            "What food item did you purchase, what was the Bill/Order Number, and when did you buy it?",
            "How much did you pay for the food or order?",
            "What was the food safety violation? (e.g., was there a foreign object like a cockroach/hair, was the food spoiled/adulterated, or did you suffer food poisoning?)",
            "Did you visit a doctor or get hospitalized? If yes, what were the medical expenses? Did you report this to FSSAI or the outlet?"
        ],
        "evidence_checklist": [
            "Purchase Bill / Cash Memo / Food Delivery App Order receipt",
            "Clear photographs and video of the contaminated food or foreign objects",
            "Medical Report, Doctor's Prescription, and Hospitalization Summary (in case of food poisoning)",
            "Pharmacy bills and medical laboratory test reports",
            "FSSAI (Food Safety and Standards Authority of India) complaint registration copy or report",
            "Emails/Chat screenshots with the food delivery platform (Zomato/Swiggy) or restaurant manager",
            "Copy of the product packaging showing expiry date or pricing details (in case of expired/overcharged goods)"
        ],
        "confonet_template_reference": {
            "title": "Grievance against Food Outlet / Manufacturer for supply of unsafe, contaminated food and product liability",
            "legal_grounds": [
                "The Respondent is liable under Section 2(34) (Product Liability) and Chapter VI of the CPA 2019 for harm caused due to defective food products.",
                "The supply of contaminated, unhygienic, or adulterated food is a gross deficiency in service and poses a direct hazard to public health and the right to life of the consumer."
            ]
        }
    }
}

DEMO_SCENARIOS = [
    {
        "id": "demo1_ecommerce",
        "domain": "e-commerce",
        "title": "E-Commerce: Damaged Laptop Delivery & Refund Denial",
        "description": "User ordered a Dell Inspiron Laptop worth ₹55,000 from Flipkart. The package was delivered with a broken screen. Flipkart customer support refused refund/replacement claiming delivery was completed successfully.",
        "data": {
            "complainant_name": "Rohan Sharma",
            "complainant_address": "Flat 402, Royal Residency, Sector 62, Noida, Uttar Pradesh - 201301",
            "complainant_email": "rohan.sharma@email.com",
            "complainant_phone": "+91 98765 43210",
            "respondent_name": "Flipkart Internet Private Limited",
            "respondent_address": "Buildings Alyssa, Begonia & Clover, Embassy Tech Village, Outer Ring Road, Bengaluru, Karnataka - 560103",
            "order_id": "OD104928104820",
            "order_date": "2026-04-10",
            "transaction_amount": 55000,
            "product_name": "Dell Inspiron 15 Laptop (Intel i5, 16GB RAM, 512GB SSD)",
            "grievance_date": "2026-04-14",
            "defect_details": "The laptop package was delivered on April 14, 2026. Upon unboxing, the laptop screen was found to be shattered and there were deep dents on the body. An unboxing video was recorded. Customer support was contacted immediately, but they rejected the refund/replacement request on April 16, 2026, stating that the logistics partner reported safe delivery and that no transit damage could have occurred."
        }
    },
    {
        "id": "demo2_banking",
        "domain": "banking",
        "title": "Banking: Failed ATM Cash Withdrawal but Account Debited",
        "description": "User attempted to withdraw ₹20,000 from an SBI ATM using an HDFC Debit Card. The ATM failed with a timeout, no cash was dispensed, but HDFC debited ₹20,000. HDFC Bank failed to credit the money back even after 30 days.",
        "data": {
            "complainant_name": "Meera Krishnan",
            "complainant_address": "House No. 12, Park View Enclave, Kakkanad, Kochi, Kerala - 682030",
            "complainant_email": "meera.krishnan@email.com",
            "complainant_phone": "+91 94470 12345",
            "respondent_name": "HDFC Bank Limited",
            "respondent_address": "HDFC Bank House, Senapati Bapat Marg, Lower Parel, Mumbai, Maharashtra - 400013",
            "account_number": "50100239481023",
            "transaction_id": "TXN_ATM_SBI_48102",
            "transaction_date": "2026-03-05",
            "transaction_amount": 20000,
            "grievance_date": "2026-04-05",
            "defect_details": "On March 5, 2026, the Complainant tried to withdraw ₹20,000 from an SBI ATM located at Kakkanad. The machine made sound but did not dispense any cash, showing 'Transaction Timeout' on the screen. However, the Complainant immediately received an SMS that ₹20,000 was debited from her HDFC Bank account. She submitted a written complaint to HDFC Bank on March 6, 2026. Despite the RBI guidelines stating failed ATM transactions must be reversed within T+5 days, HDFC Bank has failed to reverse the amount or pay the daily penalty of ₹100/day even after more than 30 days."
        }
    },
    {
        "id": "demo3_telecom",
        "domain": "telecom",
        "title": "Telecom: Wrongful Postpaid Billing & Service Suspension",
        "description": "Airtel charged the user ₹12,500 on a postpaid plan where the normal bill is ₹599. Airtel claimed international roaming charges, but the user was in India. They suspended the line when the user refused to pay the disputed bill.",
        "data": {
            "complainant_name": "Aditya Verma",
            "complainant_address": "A-88, Shanti Kunj, Malviya Nagar, Jaipur, Rajasthan - 302017",
            "complainant_email": "aditya.verma@email.com",
            "complainant_phone": "+91 98290 88888",
            "respondent_name": "Bharti Airtel Limited",
            "respondent_address": "Bharti Crescent, 1, Nelson Mandela Road, Vasant Kunj, Phase II, New Delhi - 110070",
            "mobile_number": "+91 98290 88888",
            "bill_number": "AJ/2026/9820492",
            "disputed_amount": 12500,
            "grievance_date": "2026-02-15",
            "defect_details": "The Complainant received a postpaid mobile bill dated February 15, 2026, for an amount of ₹12,500, which is extremely high compared to the normal monthly plan charge of ₹599. The bill charged for international roaming data usage. The Complainant has not traveled outside India during the billing cycle and had his SIM active on the local network in Jaipur throughout. Airtel customer service and the Nodal Officer (docket ID: DEL-1049281) refused to correct the bill. Subsequently, on March 1, 2026, Airtel suspended all outgoing and incoming services on the Complainant's phone, causing severe disruption to his business and personal life."
        }
    },
    {
        "id": "demo4_food",
        "domain": "food",
        "title": "Food Safety: Severe Food Poisoning from Restaurant Delivery",
        "description": "User ordered Chicken Biryani from a local restaurant via Zomato. Found a cockroach inside the food. Experienced severe food poisoning, resulting in 2 days of hospitalization and ₹15,000 in medical bills.",
        "data": {
            "complainant_name": "Dr. Sandeep Deshmukh",
            "complainant_address": "Flat 101, Yashashree Towers, Shivajinagar, Pune, Maharashtra - 411005",
            "complainant_email": "sandeep.deshmukh@email.com",
            "complainant_phone": "+91 99220 54321",
            "respondent_name": "Spicy Treat Restaurant (Zomato Partner)",
            "respondent_address": "Shop No. 5, Ground Floor, Lotus Plaza, F.C. Road, Shivajinagar, Pune, Maharashtra - 411004",
            "bill_number": "ST-ZOM-2026-4920",
            "purchase_date": "2026-05-10",
            "transaction_amount": 450,
            "food_item_name": "Special Chicken Biryani",
            "grievance_date": "2026-05-11",
            "defect_details": "On May 10, 2026, the Complainant ordered Special Chicken Biryani from Spicy Treat Restaurant. While consuming the meal, the Complainant discovered a dead cockroach mixed in the rice. The Complainant took photos immediately. Within a few hours, the Complainant started vomiting and experienced severe abdominal pain. He was rushed to Ruby Hall Clinic, where he was diagnosed with acute food poisoning due to contaminated food consumption. He was hospitalized for 2 days (May 10 to May 12, 2026), incurring medical expenses of ₹15,000. The restaurant refused to acknowledge responsibility or compensate for the medical expenses."
        }
    }
]
