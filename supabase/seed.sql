-- Sierra Home Pros LLC — Initial Seed Data for Self-Hosted Supabase (Zo Computer)

insert into public.maintenance_plans (
  slug, name, tagline, monthly_price, annual_price, visits_per_year,
  handyman_discount_pct, priority_window, features, is_popular, active
) values
(
  'essential-care',
  'Sierra Essential Care',
  'Bi-annual preventive home tune-ups for Reno & Sparks homeowners',
  49.00, 499.00, 2, 10, '48-Hour Priority Scheduling',
  '["Spring & Winter 22-point home inspection","HVAC filter replacement & thermostat check","Smoke & CO detector battery testing","Exterior hose bib winterization & caulk audit","10% off written handyman & painting estimates"]'::jsonb,
  false, true
),
(
  'seasonal-pro',
  'Sierra Seasonal Pro',
  'Quarterly whole-home care built for Northern Nevada freeze-thaw seasons',
  89.00, 899.00, 4, 15, '24-Hour Priority Dispatch',
  '["4 quarterly seasonal visits (Spring, Summer, Fall, Winter)","Gutter clearing, roof-line check & weatherstripping","Smart-home battery, Wi-Fi lock & doorbell checkup","Dryer vent lint inspection & sink trap check","15% off all repair, painting & smart-home jobs","2 included minor handyman fixes per visit"]'::jsonb,
  true, true
),
(
  'senior-safety-total',
  'Senior Safety & Total Home',
  'Quarterly maintenance + dedicated aging-in-place safety & accessibility care',
  149.00, 1499.00, 4, 20, 'Same-Day Emergency Priority',
  '["4 quarterly whole-home & ADA safety visits","Grab-bar load torque check & non-slip rail inspection","Motion nightlight, lever handle & threshold ramp maintenance","Seasonal winterization, gutter clearing & HVAC filter swaps","Family caregiver photo walk-through report after every visit","20% off additional home safety & repair projects"]'::jsonb,
  false, true
)
on conflict (slug) do nothing;

insert into public.crm_contacts (
  full_name, email, phone, street_address, service_area, property_type, lead_stage, source, lifetime_value, notes, tags
) values
(
  'Margaret & Robert Chen', 'mchen@example.com', '(775) 555-0134', '1842 Damonte Ranch Pkwy', 'Reno, NV',
  'Senior Residence', 'Plan Member', 'Referral', 5648.00,
  'Primary bath ADA grab bars installed. Prefers morning appointments before 11 AM.',
  array['Senior Safety', 'ADA', 'Priority']
),
(
  'Thomas & Linda Holloway', 'tholloway@example.com', '(775) 555-0151', '614 West King St', 'Carson City, NV',
  'Single-Family Home', 'Plan Member', 'Website (sierrahomepros.com)', 2099.00,
  'Enrolled in annual Winter Maintenance Plan. 2-story stucco with rear patio deck.',
  array['Maintenance Plan', 'Winterization']
),
(
  'Daniel & Claire Vance', 'dvance@example.com', '(775) 555-0172', '910 Country Club Dr', 'Lake Tahoe, NV',
  'Mountain Cabin', 'Active Client', 'Google Local', 6400.00,
  'Exterior cedar deck & trim repaint in progress. Interested in Seasonal Pro plan for snow/freeze protection.',
  array['Exterior Paint', 'Tahoe', 'Upsell Plan']
),
(
  'Priya Nair', 'pnair@example.com', '(775) 555-0183', '3215 Wingfield Hills Rd', 'Sparks, NV',
  'Single-Family Home', 'Active Client', 'Website (sierrahomepros.com)', 1850.00,
  'Nest thermostat + smart deadbolts + video doorbell install. Great candidate for Essential Care.',
  array['Smart Home', 'Sparks']
),
(
  'Kevin & Sarah Brooks', 'kbrooks@example.com', '(775) 555-0198', '7420 Somersett Ridge Pkwy', 'Reno, NV',
  'Single-Family Home', 'Estimate Sent', 'Nextdoor Reno', 1480.00,
  'Drywall patch & interior door repair bundle. Sent written add-on for pantry bifold track.',
  array['Handyman', 'Somersett']
)
on conflict (email) do nothing;
