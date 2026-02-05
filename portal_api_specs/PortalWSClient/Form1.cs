/*
Autor:      indaco systems (www.indaco.ro)
Data:       21.12.2012
Versiunea:  1.0
Descriere:  Exemplu de apel al serviciului de acces programatic la date despre dosare http://portalquery.just.ro/query.asmx

Istoric modificari:
Data        21.12.2012
Descriere:  Prima versiune
 */
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Windows.Forms;

namespace PortalWSClient
{
    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();


        }


        /// <summary>
        /// Apel metoda cautare sedinte dupa data sedinta si instanta
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void button2_Click(object sender, EventArgs e)
        {
            PortalWS.Query ws = new PortalWS.Query();
            PortalWS.Sedinta[] ret = ws.CautareSedinte(Convert.ToDateTime(textBox1.Text), PortalWS.Institutie.CurteadeApelALBAIULIA);

            if (ret != null)
                MessageBox.Show(ret.Length.ToString() + " rezultate");
            else
                MessageBox.Show("Null");
        }

        /// <summary>
        /// Apel metoda cautare dosare dupa numele partii din dosar
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void button3_Click(object sender, EventArgs e)
        {
            PortalWS.Query ws = new PortalWS.Query();
            PortalWS.Dosar[] ret = ws.CautareDosare(null, null, textBox3.Text, null, null, null);
            
            if (ret != null)
                MessageBox.Show(ret.Length.ToString() + " rezultate");
            else
                MessageBox.Show("Null");
        }


    }
}
