update public.product_config
set
  version = version + 1,
  active_years = array[2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025],
  dataset_version = 'multi-era-v1.6.0',
  updated_at = now()
where
  id = true
  and dataset_version = 'multi-era-v1.0.0'
  and active_years = array[2015, 2017, 2019, 2020, 2022, 2023];
