-- Insert test therapist-customer links

-- Link test therapist to test customers
INSERT INTO core.therapist_customer (id, therapist_id, customer_id, created_at, created_by)
VALUES ('2testTherCust001XyZ12345', '2testTherapist001XyZ12345', '2testCustomer001XyZ12345', 1725824055, '2imfnAVjkbfcwEos1LLLztn1vEP');

INSERT INTO core.therapist_customer (id, therapist_id, customer_id, created_at, created_by)
VALUES ('2testTherCust002XyZ98765', '2testTherapist001XyZ12345', '2testCustomer002XyZ98765', 1725824055, '2imfnAVjkbfcwEos1LLLztn1vEP');

INSERT INTO core.therapist_customer (id, therapist_id, customer_id, created_at, created_by)
VALUES ('2testTherCust003XyZ11122', '2testTherapist002XyZ98765', '2testCustomer003XyZ11122', 1725824055, '2imfnAVjkbfcwEos1LLLztn1vEP');
