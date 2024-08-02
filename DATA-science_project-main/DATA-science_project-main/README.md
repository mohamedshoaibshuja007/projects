# Data analyser using python 
In this project we will use data scraping from a udemy data set to analyse data 
* import pandas as pd -- To import Pandas library.
* pd.read_csv - To import the CSV file in Jupyter notebook.
* head() - It shows the first N rows in the data (by default, N=5).
* unique( ) - It shows the all unique values of the column.
* value_counts - In a column, it shows all the unique values with their count. It can be applied to a single column only.
* df[df.Col_1 = = ‘Element1’] - Filtering – We are accessing all records with Element1 only of Col_1.
* df.sort_values(‘Col_name' ,  ascending=False ) - To sort the dataframe wrt any column values in descending order.
* df[ (df.Col1 = = ‘Element1’) & (df.Col2 == ‘Element2’) ] - Multilevel filtering - And Filter – Filtering the data with two & more items.
* str.contains('Value_to_match’) - To find the records that contains a particular string.
* dtypes - To show datatypes of each column.
* pd.to_datetime(df.Date_Time_Col) - To convert the data-type of Date-Time Column into datetime[ns] datatype.
* dt.year - Creating a new column with only year values.
* df.groupby(‘Col_1’)['Col_2'].max() - Using groupby with two different columns.
* <img width="923" alt="Screenshot 2023-08-09 112538" src="https://github.com/Idris-shuja/DATA-science_project/assets/110660097/a871bcee-8230-40f9-ab25-8d44f3e46fdf">
