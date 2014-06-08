/*
  Copyright (c)2008-2011 University of Virginia
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted without royalty fees or other restrictions, provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
    * Neither the name of the University of Virginia, the Dept. of Computer Science, nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE UNIVERSITY OF VIRGINIA OR THE SOFTWARE AUTHORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/



#define LIMIT -999
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <math.h>
#include "needle.h"
#include <sys/time.h>
#include "common_args.h"
#include "common.h"
#include "common_rand.h"
#include <getopt.h>


char* expected_aligned_seq_1_chars = "------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------BADAHHAJC-BHBJJC-I-G-IHJCE--HB-IABD--D-GBHC-C--A----AJGHCEJI--DJICGJ--EJIHFFAJGBJGBDJB-CIA-D-AHE--AIJ-G-F-FAJEJH--IB-EJ--IBEBE-GGAAIJBBD-I--AE--DJJ-G-EDFGD-HGB--G-IJG--FIIID-G--J-B---C-I--H-BCGGHGHHHAJ--IF------I-----CG-G-CG-----H--F---E--GDI-F-FIFB-DC---BEDCHBGDE-BFE-J--GAAAAAGAGDCDECFGCBE--GIEA-GB--CDAJACFI----I-JDAFJJ-----FCC--CJC-E-GDCBBDDIDBG--HDDAFJIDCDC-----HEACCIDBJHJGFGC--CA-IIB-DFE-FEE----I-FBC-IGAAH-GHBJFJH--HIABHFB-E-EDG-----EE--HIBA-BJAHGBJ-IDE--EAEABGHFDAAFBDG-CG-GJAEEG--A-G--ACEJ-E-GIGCH---DA---F-JCCGF-HFI-EEE-C-HICHJBEFIHBJFADHBEC-AH-HGGD---AA---B--E--AHJGJ-BH-ICA-FJFHJ---JHFEAIAJGCI------I-GF-FJE-I-I--CIDGGEABGAAAD-BBGH---DG-JBBCCI-J-I--BDIE-H--AF--CDCJHDC-FHB--IHCEAJJC-BDEEBDBA-BH--E-C-CDDFJGCGCDGHB-GHBAJCBI-FGH-HGDD-EIBCIIE-CHEIAHE--CJAIFAIBGIJ----AD---ICHEFB-F-IGGBE---GD-BJA---DH-I--ADJECA-F--BFAHCFE-JAIEGBEI-EHIF-A--AIBCG--IGCAH-HJEBBBH--D-IAEFFFEHJ-B-I-G-C--D---FC-H-FGBA------H-DB--HAJ---CFFB-EJ---J-FJJ---EC-JBIC------D--FBCJ-BIF---ID----DJCE-CI--FIAE------A-JDGE-EIC-ADDDHADDJDHB--GF-AEGHGHIIIDFFHFFE-AFA--GEC-C-IACCHHIJHCGJ-CGJ-B-GE---CIEA-HJGAECC-IGAGJF--DCDAGCJFAEIIDA----A--HE------EG-IB-EE--EJ--BIGG-GDFJEEHAIJCDBFGGFFCH--GHJFBBBFE---A--ADBJ-BEHACI-IEFF-BD-FJHAIA--D-DBE--I-HHCIBAGJCGB-J-CHH-B--IBFAB-F-ADJHHD-EC-I-IGCG-DAHGIG-GAHDIBCF-FFJDDDABDFEBIHHEGFI--GICD---DAH--EH---H-FJJ-H-I---A-HCFFACFGBFCC----BHHFFJE-BFGCD-G---HHAHHJ--H-HA-HFDGBDFE--CBG-F-DAJ----GEBHFBIA-DF---EHDIJH-E-DH-AH-HJC-ED-ADIDADFAJFAFFHAAHGHI---CJJEFDB-CJ--A---EBHE-F-DGABIIHFCFBHE-A--E-EAABIAIC-FCAEEDJHB--CAJE---I---I-DC-H--J---EGD-IGDJGJFAJ-FCIJEFB-HI---HHJ-----F-DHGFAABG--I-H-HBIH-BIECD-IDGEBE-IGCFF-IJ-D---DJ-C-CJHBDFJGEE-IGBADHF-IHHIGFBFIDIBDGFHAFH-BFJICBDAGF-DFAIBGJFBDEGHAIGE-DEADCEAJDH-E-ICJAGCIIEDBJF-DJFEGGGDC-IGBGJAIAEGFEJFH----EI-DAA-GI-EGGCFEE-FEHHHB---B----B--G-HE-E-H-JBF-D--H-----H-F--FE-HJDJFCJIA-A----E-CE----ECHE-IJ-AJHBGA--BFCBFBHCAAGH---GII-B--B-D-G-H-ACGEJ--EDIGGJDBC---G----BBAFBJEJCAJDC--HHGDCCJ-DJAH-CGH-JDEJC-H--F--EDDDEJCAABJ-----A-H----JBCABFHIHDHFJBB--JDH-CAJ---GE-E--B-----C-GIDDAHJEG-BA-CBDDJCEAFBDGH-AICIDAE-HAGHJABBGIEDJEGFJ-DD-F-GB--CDHHFADEJEHHBC--A-B---GE-DG--F-BFDAIE---AE-DEEAIBJFBCCB--AFADH-E-FBHEFH-DFDFJAEEAGBIE---DDJ-A-IACCIFFC-CBI--IFJA-DDIF--DGE--HG-HIFIGA-J------CHJ-EJ-AHDFE-D--JHG-DHDJCGB-CJE-DFD--------AEDAHFCBIEBICGDH-CDHE--GG-AIEJFFJFGBF-CHDJBAGH--I-FGAHAHAAJ-IEIEEJJEE-D-B-I-CAFEHBFIJIEGCEEADGEDJ--H---G-ICCDGCDJDBJI-HJ-----ECEHICE---D--E-CHC-G-J--BFDICBDBF-C-DCD---H-----G---J-BB-H-----------------G-D-EHDGFCHCJ-FA---IIDAGIAADFHDEDGE---I--HBJAICBFAFDCACFJF-FGC-I-ABBA-CFHG--HJADAGCHGCJJGJIIJABCACHD-CIDDI--FB--ADEHF--ID-BBFCHJ-AACEHBGJFAFBDFFAFBEBCHHA-CDDEIDAAGJEIHHCJIFDAJCB-GIBHBEIHDFJGHEAGE----EFADGJ-GJHGGFBEBBEJHCGIGHHHDFBFCJDAI-BIDJ--IJGGBACAHHCHGI-CHGIAFB-G-JDBA--HHAJ-BAEE--I-ABCA---FEJCFAHGJDDJDI-BA-IG-G-IIAD-DIHDHAGGJFFFCAJEJFJA--H-FDEAAEHAAE-EDF-ADIJICFDAFAAGJEEJEEC--IFJ-CFDGJ--BAHBDE-AHF----AHAJBCHAAFD-HH-C-FBD-B-FCDF-A--B-B-I-ADFGFIBCB-JIAEF--CGCCG--IGDDHDIJCDBJIFEB-CIBI--D-DA-F--E-FE----JJ---ACDDBJADEEAAEEGGI-HEJJHFC----H-GGE--DFD-IECID-A---F--GEDAJABDJFD-B-DFC---E-IICGFFBED-BHIBADDIGJ--FBI-CFJDDGHHIGIGH-I--CC-BAF-CFGFCAAHBEDDEDGJCCDFDJJC-HCBHEGJBCJI---AHGJJFCICF--AIDDECADHAG-CIHDDHBCDFDIAJDGGIAEJ-IIBIHHJ-IDHJBFDDFDICBJEFHGEHEAEHHJIJFAHD-EBAFFBBGE-F---ACGDCE--IFJ--HBDAAJCHBCIADHC----C-H-E----DJ-JEGA-FDJBJBJJJIBAEJ-CJ-HJ-C-HI----EHIFDDE-CJAJCD--HCADHEICIIEFJJ-C-CC-C-IBEF-I---B---IJ-A--EJBBGJGIBC---FCCIB----G--FJHBAD--HCGBBEEABEFFIGABHI-DAGJBACDAGCIAHJE-FBIIFGGIJ-EBDJADJIECF-DGAAGEAJDBIBGB--I-F-EBG-HIBHHBG-----A---G-FHAH-DAD-FDC--AJEGIJHJ--GED--IEJIGBFGCEEB-AIAIE-DBE-HFJICGDH-HFI-EGCFBJJAJAIFDE--D--EHCD-DDEICG-FCCHABDFAIDEFB-AABCG--GEHGHJ-BFAIGCCGEFDHCGBDGIBHCJFEJCIGBHDDGIHHEFJDBEFE-DAGCAFGCDJEFA---I--EB---GGH---E--E-I-E--D-CHCEFJGAIDCFD--IJ---GDJ-GDEAD---D--EFJBEBEDGFCFAFB---IDGFDEHCGFFDCIEABFIBJBICIEDHCFJBJJEJHBHFJBACICEDGH-IBICDCHCDIBJHDEDGGFJAACA-GEIBCGGJCHCIHHGCJFHAHE-GFEAGGBCI-FGGB---I----B-HFGAIJCBJIDBIIJCJIHDAABCBDFBE-EFFGFGI-HGGHGHBDFEB--DD-D--EADBCFAHDFIHECICCBHJAHHCJIBEFACFCDJA--EGDG-GABGGJFIIFGBJCJFCHBHEJHFCHADFGGACGIBC-CBAAI-IHCDGDBJDHEIEJHDBHCHADEC-DIGFF--I-DHJ-AGE-J-FGJ-----E--CG-BAFJB--I-EFFCHGJ-BCFCB-CCIED---B-AEGF---FJ--C-H---GEJHDFFIECF-D---AG-------E-FGIAFDAH---JF--B---I-H-B--JCD-----G-HB--BHEJ--E-E-E-A---BEJGB-----DIA-DAIHFHGFHBEIJEFFDHGGEIJGCCAGGGAH-D----BAI-DBC-ICHIJBH-DAJEFDB-HIIIHEHE-DIABHG-GFIEBA-IBFB-HCAJHGCF--GIJG-IGBFCHADFGCICJGEAHJIFGCIHAGFCCEJC-FCEDECBH-JF-EGFCDHJAJBJCHDC-A-BHDDJBDFGDFDGAI-H--BJBBCCE-EFBHCAFCDGJDCCHCEDGCJEEFHHCGJAHJFFECBFFBIEICI-CHD-ICGCJCGCHB-JHEFBAEJHEDJGI-AI-JIB-CEDFHAHGHH-E--DE-EGEHCHI--HAH-DAIA-BE-CFDIGHAEJ-EDIGDBAJAJ---H----B-AFFHG--FBGECJJJHFBAEFJBHHCGHDBHB--BDECEDADJDIA-EHIEAGFFCAJ-GIACB-JE---GGI-BDIBA----F--GI-A-H--CFCAAIIEAEJGDC-B-BIGCHAE-JAICABIJD-JDEEEAAFIFE-JEAHDDCACDFJEFDECABIJFACBCHEGI--E-EHF-FHAFGJDDGEHDFHHABJDBGIDHJFIACAFBIBAHG-GGEIG-GC-CDFBHCCDGFHJDIACJ-HJABAJDEEJIH--HJA---DJG---F-E---F-I--IBE--GABIECCBCGEADHFAJE-JEBI-BJDCAIDHAAIFE--BCDGIGJDJJAEA----EJDG-IHFIJEHFGCBDEJDE----GHGFEC-CF-FIGIJIADH-EIAEHADIAGIHHHBJ-DJGCDHABEIGBBG-EFDIBFAEDAFACEGABFEDFJ-HH-AEBHIBHJIBCEFJ-JEHIFJCBAEI-G-ICBADAAJACIG-E-BABDGIEJIHHAGJC---JGG-HCIGHAE-FAAHF-HCFG--CABFFDGFAEFJJCJJAABJFBGFCB--DHEAJACEDCEDBE-CF-E--D-EGHDJEHACDGIBHGHJHAG-C----EJGAJHIGFE---GHEBFJCBGCHBDBIBDECAEJEDHDADGBGE-----J--EH--CHAD-IGBAB-HIHGEJDDCHF-AA--F-D-J---JHB-IJ-BGGEDHDFBAHF-DCDAAHFDAHGID-GEED--AAEB-GJCBJDFAAE--G-AAJDIJ-FGB-E-CDDICEGAJBBIEIBF";
char* expected_aligned_seq_2_chars = "------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------BGD-----CEID---DFIJGFI--BEFJGBFI-GDFGGJGFFIGIFFADEHBAEG-DE-IFBGJHCGABHE--HDGAEG-J-BHJGHC-AFDFE-EDHAI-FGEFDBG-E-HAGIBIE-FFI-EFEHFCAA--FBDEICBA-IHDAJIDCE-FI-JH-BFAFHC-GJJF-IFDCGACJEAEEJCAIBDHFFCBGHI---IJCDIFEEEIHAIDHCJHCBAFACFHJIHHHDEGAAJEACGD-JFJB-GBAGCEEABE--H-FIEAB-EFJCIG-CIAA-HIDCC-C--CB-FIGI-AHGBFEC-JJHBBIBDCJIDJD--JJIHIDEIDCJJCJIFEABD-BCCD-DBGFEDDDHF-GDDDDHGGHAHE-------HJ-BG-JJAAHICAHD-AHBAECDIIIGGBCBICHACED--J-JHJAHI-B-IIAEDEDGFCFIJEEJGHCCAIB---GCJEIDEIFJA-GBDHB--HF--FJI-JFJF-EGCBAHFIIACEAGEDGHGAHABBDGDIDFGJ--GFJFFBJJEEGDGIIDDJ-E--HB-CAD--ACFFHCCDDDCAIAAJJJBHAEJHAHJD-FBHDI-ADB-FAJEGDAHDEADA-G-IBHHFEBCDGFBF--DIDFDJCI-GDEAAG-AADIFBDAJJBDGDJ-F--IAJEIFFB-CAFHBIBFGJCDGJ-DDEF-BAGI-----JCIB---BGHAJCHBCEACBFDDF---FC-GHBEFD---CBICF-HJAB-BJEI--IAEFBFEB--EGHC--I-AI-FIJCFGCBDGBCIAAE--EFJI---EJCHBDFFJHICCDAIIHFA--EGACFCGGFG-DF-GJA-EDBEFHEACFGAEJA-ACDHBI-C-HFH----CHAJCJIA-GFI--JIFIIFDICJJDJJIGGEHEIG-AJJHDDIHBDBFIHA-FCHCFGBGEJFBHJCCJJADHECHJB-CBFFDHDDGIFAIJGGFFCHDIDAEBGD-DEJCIHAII-EAGJGBAAFJDIECE-DEAHFCCA-GJ-HCAACFDA-D-G---IDDADDIEDABAJBFJCACBIEGCHAI--CG-BCGJDBAAEDDDCDAAGC-G-E-BEI-AF-BEHDHDEIDJ-HE-IDAGBJEEJFHEADHCJFEGFFBCEEIFEJFEB-DGIG----EHJ-JH---GD-GCHIJG-J----AEDACABJADFJAAE---IAGEGFIBDBF--EIACBGFD-EJFIFDH-IHHF-CGBDEIC-AEBEGI-FABEFBA-J--DBE-EIHICCCJD-CD-DCBAHCBBGFBFF-----BH-EBI-HE--IHCDIBDABIDBHFJAHJBCHAC--DHJIJBBAJHI-FA--G-ICCAJBJBHHIC-EGBFBIDFGIIBBH-DHJGBAFIAIH-DG---EHDCFGFFBD-JHDDIG--H--IJDDFAIBE-G--AEECD-JAHEH-CEEDGA-I------BEIB----G-IJEHC--EIDBFDJIBAJGIE-DEIIJGFA--IH--FBH-GADFJDEFJGI-GCBBI--E--HBEAC-JEGHJICFBIAGIGHGAJFDAE-DAI-C-F-F-JBFCI--HBDDIEAJHCJAABABFGGHG---BGDHFHHJHF-HDFI--DAHDFE-EBID---JIJGGAEHDJFCAC-HB-----EIIDB---FJB-HIG---HG--D--HAFGEB-J--BFA-FHD--I-G---GE---BGEBDE--I----HBEAI---G-FI---JFJCJ-E-FG--JI--DJ---E--E--HJDJJEIGGHHGGIHA-GCF--DG----BAIJBGJFGBJJFCHECEDHFJAFIDAGHDBAFGHCFBDG-BHADJF--BABAGHIDEGC-CGBCEGHAGI-CA--FGAEDBG-BGBH--AGHJFAGICABFFBADBGFDBFCG--HIE-I-GJ--CHIEFEIEIFBJIBJE-C--ICIBABG-HCJBG-EHFBFHFJHEECBHEAFCDEDIDEJ-EAB-IGGGCEIHAGAIJCC-FF--HFHF-IBJEJGHFCF-BFDGEGEHHFAHAAACAFADD-H--BHBADC-DG-H-A-BDCHJEI-ID--IH--H-A-AII-G-AGGJIDCJGEGBIECIIAF-DEJECAACFJEBBHFGGEBHGAAFGBI--IEDDCAJHD---I--FA-C-EEAGA--JECF-CA-HJDDDD-A--A--IEJCIDCAFAEIA--IDHCHIAIAFIF-AJGD-FBBFFEAFHDACI-IDHDJGGGGDDDHJAE-ICHC-EJDBCJHGJGA-JC-IJC-EGGFGFIIIFEFJAE-A-F-FGA-IFBDHCCGHEHBDGBAI-----FD--EC---B--HEJICFG--JD-AJBIEI-----ACDABJDJCA-E-B-I-I----E-DDECJBCHFJJGHI-GDGBBA-BJIFCJCDFBCEBE-I-EGCJDBGEBC-GEGBJFDFFDICI-FGECAGCFAAJHAAFFFGIJAJGCBEHEECAACEGFFFGJFJGBGDDFE-DD-I-IJGFAEDBIIFBCIAFGGGD-DG-IIIIGHHAJFIC-DDFHCHHB-FEF-CAIGACFAICG-GBIGEA-AGCHDC--BEII-AIHAIH-EBIDAICCGBCHAD-HFAJI-JIGIC-JBGAC-CAG-G-GBH-FJG--BG-AAJC---I----J----CJ-B--J-BFDIHHBE-A-F----A-EIBIHE-AHHJFG-HAGF---HE--I-IG-----B-----IGCID-HGIJ--BADJ--B-GIJC--I-G-EGCJCFEFGHHA-FB--EBIIHA--AJJFFE-HF--G-FGEGIABBDBGFGEGI-DGGI-----GJ--F---E-G-HIBHCFG----HBAEAE-FGGDF-I-FG-F--BJ--J-EIHAI--HCB-G-HBBFHBCECA--EEJJA-A--C--A-DJHHDCAF-DCBJHCC-JAEEGJCHCJEDF-F-ADFHA-AEGJAC-CCFJCI---A-IE-D-JI-EBJBIIIFJGIGJCBHJEAIEJDIFJJIAFAC--F-AD-JJH-E--IBHE--H-CBJBBHBBGEGJGFGJB-CI-JABFFFCCGE---HB-JCCJCJD-CJEEEACCC-FFHEDBBH-GJCD--JCBGBIGC-ECD-ACICI--JIFACCJIHFJC-D-I----E-HED--CCGI---CEH--H-D----IDFAAAG--FGIHIJEEI-GEIH-HJGFC-HDG-GC-FH-H-GGDC-E-FGIBICC-DI-H--CDCFBIABJ---G--JAE-A-I-F--CJEDDCFBBG-GGHHHAC--CEAHIF-DDHFGAH-HH-CIBFHCFBFAIHHJAFFGBDAGJEGECF--F-F---GHA--FC-GH-GCDHGAAHHAHC-GGEGD--JCGBIHCAF--I-ID-B--HDADCACEI-EFHGHJHGHHJIJBAHDA--BHJ-I-CHJBBCIIBHHEHGHJF-CB-DIBH-DFAEE--E-F-D---IEDH-J----EG--A--ECF-GIFGBBJCEI--HH-IE-BHDD--G-----C-GBDJIFFCE--JA--HH-GCCCCJEJDCDJF-ADGDCDCGDCFHAAEGB-A-BDG-GBBIE-I---DCJE-JH-AI-HGBEBHB-IAGDCGHBCJE-CD---EJ-IA-EAJDIGE--DBAD-II-EB----B-F-ID-FFCAA-HDJJAE--HJEBD--GCCG--D----DGGB---B--BI--HDAG--H---DCEC-ID-FCA-CCD-EDAGEHIABEFCJCICHIAFEBIEIIAEGCDBCCCA--GA-AC-DHHIJIIIGHJEGDECDBFBDBEEF-B-BED-BCCH-BJAHI---HEICG-GG---A-FI---IAI-BHGF----E-AFHF-BHC-F-DDAJCB-CDI-C-IGEA-ED-DB--HHEJGEFB---J-----H-C-F--HEJIF----IIIJF-BBIAAIEAHFBJHBDHIJCFJ--B--J-JG-D--B-B-FFEJE------EA--H-H-DG-BCHGDIDBHEA-B----D-C-E---CBH-A--BJ--E-J---D-AGIE---JG-BAFJG--FD----FD-G----IC-ADBGDA---BFJFBAGIBIHC-----DHEDE-----C-EFEAJDI-FFJAAED-JCEGEFJAGG-GHGHHEJBBFABA-ABEIIJE-FC-F-FB-GCBEDBI-DGAIBGAE-FDAJFJIBIAHCICIE--DCG-EHFHDJJJAGCDAIEEEEDFHI--D-HIJIJFAABJCIIGCGFAIJCDEECEEGIIBGFBHE-HHEIEAACAFJGBE-FBAFECCDFAFD--H-HGG-C-I--IFDH--EC-GCFHFGDECGDHAEAFAIGD--JIIH-JB-JD---F-FJHIFGH-AJIDC-B-GJGDIE-AEFFFBAHC--HF-FJBG--GDI-B-C---BG--BJ--A-----C--AGB-DE-CHF-ED---HGJFCE--ID-JA-AJ-H-IEAGB--DJ-D--HCDG-IFAFFBJDB--EDE--H-H-ID--DFC-FED--JAE-----J--J---C-GD-IE---ECADFI-----D--BIJ--G--E-HED--IEA-EJI-JCE-I-E----JEJBDEBAG--CFIFBDEHEDBIBDBEGBFCC-C-E-IE--G-B-J-JCCBHFCJIBIJFFAGAJG-G-C---IF--E----CCG----BJJBGEGECA----AFECI--GFGCJJHG--HBGJEHHFFGICBHBBABCJHGJAGICGDHGABBCGA-I--E-GFCEBDB-GC-A-DJ--CA-G-DHAD--E---I-EGJ---------BJEF-------FA----EGCJDEJE-FGF--FBAIC-E-D-----JD--I---BI----B-BJH-JFF-CBJG-JC---H-B-G-H-CB-CJBHJ-FA--EEECDBGH-AFGDDJFAAHGHEGDCFAIDHI-EACGIFIE-CB----D-CA-EBJAHIHB-DFFBD--AIHEHAB--GIF-----EAHJCJE--GBIGFC--H-AC-CE-CEHBIBGHGB-CHC-EF-D--I-DCGEI-E-GD---IHDA--DDJGHD-AG-IFCB-JE--I----D---C--HBF--F-GCCIA--H--H---C---HJEHAF-CG-ECFFJI--A-EA-HCIGHECFA-DF-EEB---FJCFEEJGGFDBI--AEIG--HDAHI-IJJIA--F-GF--G------A---BGG-BEGDHE--FHE--E-FEBC-JEBFDFE---J-H-C-G-F-GH-H-DHCEBEHEJDA--I--EBJFFH-BF-C-G--BD--B-AFA---CH-H-GB-EJBFJJJFBEHIEC-ADBIAB-BGDIH-EA--C-FIAEBIGCGCJBIDJHBAI-FB-BE---FBAHBHCCIAEBBD----DJG-JGJBGFEBIF-BBADBDAEDBGFAFJHI-HFFBDEFC--BB-GA--B--I--";

void runTest( int argc, char** argv);
int maximum( int a,
             int b,
             int c){

    int k;
    if( a <= b )
        k = b;
    else
        k = a;

    if( k <=c )
        return(c);
    else
        return(k);
}

int blosum62[24][24] = {
	{ 4, -1, -2, -2,  0, -1, -1,  0, -2, -1, -1, -1, -1, -2, -1,  1,  0, -3, -2,  0, -2, -1,  0, -4},
	{-1,  5,  0, -2, -3,  1,  0, -2,  0, -3, -2,  2, -1, -3, -2, -1, -1, -3, -2, -3, -1,  0, -1, -4},
	{-2,  0,  6,  1, -3,  0,  0,  0,  1, -3, -3,  0, -2, -3, -2,  1,  0, -4, -2, -3,  3,  0, -1, -4},
	{-2, -2,  1,  6, -3,  0,  2, -1, -1, -3, -4, -1, -3, -3, -1,  0, -1, -4, -3, -3,  4,  1, -1, -4},
	{ 0, -3, -3, -3,  9, -3, -4, -3, -3, -1, -1, -3, -1, -2, -3, -1, -1, -2, -2, -1, -3, -3, -2, -4},
	{-1,  1,  0,  0, -3,  5,  2, -2,  0, -3, -2,  1,  0, -3, -1,  0, -1, -2, -1, -2,  0,  3, -1, -4},
	{-1,  0,  0,  2, -4,  2,  5, -2,  0, -3, -3,  1, -2, -3, -1,  0, -1, -3, -2, -2,  1,  4, -1, -4},
	{ 0, -2,  0, -1, -3, -2, -2,  6, -2, -4, -4, -2, -3, -3, -2,  0, -2, -2, -3, -3, -1, -2, -1, -4},
	{-2,  0,  1, -1, -3,  0,  0, -2,  8, -3, -3, -1, -2, -1, -2, -1, -2, -2,  2, -3,  0,  0, -1, -4},
	{-1, -3, -3, -3, -1, -3, -3, -4, -3,  4,  2, -3,  1,  0, -3, -2, -1, -3, -1,  3, -3, -3, -1, -4},
	{-1, -2, -3, -4, -1, -2, -3, -4, -3,  2,  4, -2,  2,  0, -3, -2, -1, -2, -1,  1, -4, -3, -1, -4},
	{-1,  2,  0, -1, -3,  1,  1, -2, -1, -3, -2,  5, -1, -3, -1,  0, -1, -3, -2, -2,  0,  1, -1, -4},
	{-1, -1, -2, -3, -1,  0, -2, -3, -2,  1,  2, -1,  5,  0, -2, -1, -1, -1, -1,  1, -3, -1, -1, -4},
	{-2, -3, -3, -3, -2, -3, -3, -3, -1,  0,  0, -3,  0,  6, -4, -2, -2,  1,  3, -1, -3, -3, -1, -4},
	{-1, -2, -2, -1, -3, -1, -1, -2, -2, -3, -3, -1, -2, -4,  7, -1, -1, -4, -3, -2, -2, -1, -2, -4},
	{ 1, -1,  1,  0, -1,  0,  0,  0, -1, -2, -2,  0, -1, -2, -1,  4,  1, -3, -2, -2,  0,  0,  0, -4},
	{ 0, -1,  0, -1, -1, -1, -1, -2, -2, -1, -1, -1, -1, -2, -1,  1,  5, -2, -2,  0, -1, -1,  0, -4},
	{-3, -3, -4, -4, -2, -2, -3, -2, -2, -3, -2, -3, -1,  1, -4, -3, -2, 11,  2, -3, -4, -3, -2, -4},
	{-2, -2, -2, -3, -2, -1, -2, -3,  2, -1, -1, -2, -1,  3, -3, -2, -2,  2,  7, -1, -3, -2, -1, -4},
	{ 0, -3, -3, -3, -1, -2, -2, -3, -3,  3,  1, -2,  1, -1, -2, -2,  0, -3, -1,  4, -3, -2, -1, -4},
	{-2, -1,  3,  4, -3,  0,  1, -1,  0, -3, -4,  0, -3, -3, -2,  0, -1, -4, -3, -3,  4,  1, -1, -4},
	{-1,  0,  0,  1, -3,  3,  4, -2,  0, -3, -3,  1, -1, -3, -1,  0, -1, -3, -2, -2,  1,  4, -1, -4},
	{ 0, -1, -1, -1, -2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -2,  0,  0, -2, -1, -1, -1, -1, -1, -4},
	{-4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4,  1}
};

cl_event ocdTempEvent;
double gettime() {
	struct timeval t;
	gettimeofday(&t,NULL);
	return t.tv_sec+t.tv_usec*1e-6;
}

////////////////////////////////////////////////////////////////////////////////
// Program main
////////////////////////////////////////////////////////////////////////////////
	int
main( int argc, char** argv)
{
	ocd_init(&argc, &argv, NULL);
	ocd_initCL();
	runTest( argc, argv);
	ocd_finalize();
	return EXIT_SUCCESS;
}

void usage(int argc, char **argv){
    fprintf(stderr, "Usage: %s \n", argv[0]);
    fprintf(stderr, "Options:\n");
    fprintf(stderr, "    -n <size>             : Number of items to generate for each of the two sequences to be matched.\n");
    fprintf(stderr, "    -g <penalty_cost>     : Cost of introducing a gap instead of matching two elements.\n");
    fprintf(stderr, "    -p <nb_possible_item> : Number of different possible values to be used during generation (1 <= nb_possible_item <= 24). \n");
    fprintf(stderr, "    -v                    : Print input data and resulting aligned sequences. \n");
    fprintf(stderr, "    -i                    : Print intermediary results. Implies -v. \n");
    fprintf(stderr, "    -s                    : Compute the intermediary results line-by-line rather than diagonally. \n");
    exit(1);
}

char to_char(int i) {
    char characters[26] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    if (i<-1 || i>=26) {
        fprintf(stderr, "ERROR: Invalid conversion to character value, integer '%d' out of range\n", i);
        exit(1);
    }

    if (i == -1) {
        return '-'; // Gap
    } else {
        return characters[i];
    }
}
int to_int(char c) {
    if (c == '-') {
        return -1;
    } else {
        if (c < 'A' || c > 'Z') {
            fprintf(stderr, "ERROR: Invalid conversion to int value, char '%c' out of range\n", c);
            exit(1);
        }
        return c - 'A';
    }
}

int max_rows = 0;
int max_cols = 0;
int input_index(int row_index, int col_index) {
#ifdef CHECK_ACCESS_BOUNDS
    if (row_index < 0 || row_index >= max_rows ||
        col_index < 0 || col_index >= max_cols) {
        fprintf(stderr, "ERROR: out of bounds access row_index: %d col_index: %d\n", row_index, col_index);
        exit(1);
    }
#endif
    return row_index * max_cols + col_index;
}

int* to_int_values(char* s) {
    int length = strlen(s);
    int i;
    int* int_values = (int *)malloc( length * sizeof(int) );

    for (i=0; i<length; ++i) {
        int_values[i] = to_int(s[i]);
    }

    return int_values;
}

int seq_equal(int* seq_1, int* seq_2, int seq_1_size, int seq_2_size) {
    int i;
    if (seq_1_size != seq_2_size) {
        return 0;
    }

    for (i=0; i<seq_1_size; ++i) {
        if (seq_1[i] != seq_2[i]) {
            return 0;
        }
    }

    return 1;
}

void printM(int *mat, int m, int n){
  int i,j;
  for(i=0;i<m;++i){
    for(j=0;j<n;++j){
      fprintf(stderr, "%.4d,", mat[i*n+j]);
    }
    fprintf(stderr, "\n");
  }
}

void printMD(cl_mem a, int m, int n){
    int *x = malloc(sizeof(int)*m*n);
    clEnqueueReadBuffer(commands, a, CL_TRUE, 0, sizeof(int)*m*n, x, 0, NULL, NULL);
    clFinish(commands);
    printM(x, m, n);
    free(x);
}

void runTest( int argc, char** argv) {

    int penalty,idx, index;
    int *input_itemsets, *output_itemsets, *reference;
    int size;
    double t1, t2;
    int i,j,k,l,c;
    int nw, n, w, traceback;
    int new_nw, new_w, new_n;

    int *input_seq_1, *input_seq_2, *aligned_seq_1, *aligned_seq_2;
    int input_seq_1_size = 2;
    int input_seq_2_size = 2;
    int aligned_index_1 = 0;
    int aligned_index_2 = 0;
    int aligned_seq_size = 0;
    int input_index_1 = 0;
    int input_index_2 = 0;
    int nb_possible_seq_items = 10;
    int w_limit = 0;
    int n_limit = 0;
    int print_results = 0;
    int print_intermediary_results = 0;
    int use_parallelizable_version = 1;

    int expected_aligned_seq_1_size = strlen(expected_aligned_seq_1_chars);
    int expected_aligned_seq_2_size = strlen(expected_aligned_seq_2_chars);
    int* expected_aligned_seq_1 = to_int_values(expected_aligned_seq_1_chars);
    int* expected_aligned_seq_2 = to_int_values(expected_aligned_seq_2_chars);

    cl_mem matrix_d, reference_d;
  	cl_int errcode;
    penalty = 1;

    while((c = getopt(argc, argv, "n:g:p:vsih")) != -1) {
        switch(c) {
        case 'n':
            // The rest of the implementation requires max_rows and max_cols to be equal
            // Size of the first sequence to be generated
            input_seq_1_size = atoi(optarg);
            // Size of the second sequence to be generated
            input_seq_2_size = atoi(optarg);
            break;
        case 'g':
            // Penalty cost for introducing a gap instead of matching to another
            // item
            penalty = atoi(optarg);
            break;
        case 'p':
            // Number of different items to generate
            nb_possible_seq_items = atoi(optarg);
            if (nb_possible_seq_items < 1 || nb_possible_seq_items > 24) {
                fprintf(stderr, "The number of different items to generate should be between 1 and 24.\n");
            }
            break;
        case 'v':
            // Verbose?
            print_results = 1;
            break;
        case 'i':
            print_intermediary_results = 1;
            print_results = 1;
            break;
        case 's':
            // Sequential version?
            use_parallelizable_version = 0;
            break;
        case 'h':
            // Help
            usage(argc, argv);
            break;
        default:
            usage(argc,argv);
        }
    }

    // Increase size by one to reserve space for the dynamic programming
    // base cases, where only gaps are used
    max_rows = input_seq_1_size + 1;
    max_cols = input_seq_2_size + 1;

    // To precompute substition costs for every pair of items.
    // Data is aligned with corresponding values in input_itemsets
    reference = (int *)malloc( max_rows * max_cols * sizeof(int) );

    // To store the dynamic programming results
    input_itemsets = (int *)malloc( max_rows * max_cols * sizeof(int) );

    // To store the first and second sequences to be matched. Start at 1 to
    // align the data with input_itemsets
    input_seq_1 = (int *)malloc(max_rows * sizeof(int));
    input_seq_2 = (int *)malloc(max_cols * sizeof(int));

    // To store the aligned sequences after matching.The aligned sequences use up
    // to the sum of items of both individual sequence, with the worst
    // case being when gaps are introduced for every item.
    aligned_seq_size = input_seq_1_size + input_seq_2_size;
    aligned_seq_1 = (int *)malloc(aligned_seq_size * sizeof(int));
    aligned_seq_2 = (int *)malloc(aligned_seq_size * sizeof(int));

    if (!input_itemsets || !input_seq_1 || !input_seq_2 ||
        !aligned_seq_1  || !aligned_seq_2) {
        fprintf(stderr, "ERROR: can not allocate memory");
        exit(1);
    }

    // Initialize memory to zero
    for (i=0; i<max_rows; i++){
        for (j=0; j<max_cols; j++){
            input_itemsets[input_index(i,j)] = 0;
        }
    }

    // Initialize the aligned data to be all gaps
    for (i=0; i<aligned_seq_size; ++i) {
        aligned_seq_1[i] = -1;
        aligned_seq_2[i] = -1;
    }

    // Generate two random sequences to align.
    for(i=1; i<max_rows; i++){
        input_seq_1[i] = abs(common_rand()) % nb_possible_seq_items;
    }
    for(j=1; j<max_cols; j++){
        input_seq_2[j] = abs(common_rand()) % nb_possible_seq_items;
    }

    if (print_results) fprintf(stderr, "Computing dynamic programming results\n");
    t1 = gettime();
    // Precompute substitution costs for every pair of sequence item.  Start
    // storing substitution costs at (1,1) to align the reference table values
    // with the corresponding dynamic programming results
    for (i = 1 ; i < max_rows; i++){
        for (j = 1 ; j < max_cols; j++){
            reference[input_index(i,j)] = blosum62[input_seq_1[i]][input_seq_2[j]];
        }
    }

    // Set cost for dynamic programming base cases, when only gaps are used.
    // (0,0) has a cost of 0 (no gap),
    // all others incur a cost of 'penalty' for each skipped item.
    for(i = 1; i< max_rows ; i++)
        input_itemsets[input_index(i,0)] = -i * penalty;
    for(j = 1; j< max_cols ; j++)
        input_itemsets[input_index(0,j)] = -j * penalty;


    cl_program clProgram;
    cl_kernel clKernel_nw1;
    cl_kernel clKernel_nw2;

    FILE *kernelFile;
    char *kernelSource;
    size_t kernelLength;

    kernelFile = fopen("needle_kernel.cl", "r");
    fseek(kernelFile, 0, SEEK_END);
    kernelLength = (size_t) ftell(kernelFile);
    kernelSource = (char *) malloc(sizeof(char)*kernelLength);
    rewind(kernelFile);
    fread((void *) kernelSource, kernelLength, 1, kernelFile);
    fclose(kernelFile);

    clProgram = clCreateProgramWithSource(context, 1, (const char **) &kernelSource, &kernelLength, &errcode);
    CHKERR(errcode, "Failed to create program with source!");

    free(kernelSource);

    errcode = clBuildProgram(clProgram, 1, &device_id, NULL, NULL, NULL);
    if (errcode == CL_BUILD_PROGRAM_FAILURE)
    {
      char *log;
      size_t logLength;
      errcode = clGetProgramBuildInfo(clProgram, device_id, CL_PROGRAM_BUILD_LOG, 0, NULL, &logLength);
      log = (char *) malloc(sizeof(char)*logLength);
      errcode = clGetProgramBuildInfo(clProgram, device_id, CL_PROGRAM_BUILD_LOG, logLength, (void *) log, NULL);
      fprintf(stderr, "Kernel build error! Log:\n%s", log);
      free(log);
      return;
    }
    CHKERR(errcode, "Failed to get program build info!");

    clKernel_nw1 = clCreateKernel(clProgram, "needle_opencl_shared_1", &errcode);
    CHKERR(errcode, "Failed to create kernel!");
    clKernel_nw2 = clCreateKernel(clProgram, "needle_opencl_shared_2", &errcode);
    CHKERR(errcode, "Failed to create kernel!");

    size = max_cols * max_rows;
    reference_d = clCreateBuffer(context, CL_MEM_READ_ONLY, sizeof(int)*size, NULL, &errcode);
    CHKERR(errcode, "Failed to create buffer!");
    matrix_d = clCreateBuffer(context, CL_MEM_READ_WRITE, sizeof(int)*size, NULL, &errcode);
    CHKERR(errcode, "Failed to create buffer!");

    errcode = clEnqueueWriteBuffer(commands, reference_d, CL_TRUE, 0, sizeof(int)*size, (void *) reference, 0, NULL, &ocdTempEvent);
    clFinish(commands);
    CHKERR(errcode, "Failed to enqueue write buffer!");

    errcode = clEnqueueWriteBuffer(commands, matrix_d, CL_TRUE, 0, sizeof(int)*size, (void *) input_itemsets, 0, NULL, &ocdTempEvent);
    clFinish(commands);
    CHKERR(errcode, "Failed to enqueue write buffer!");

    size_t localWorkSize[2] = {BLOCK_SIZE, 1}; //BLOCK_SIZE work items per work-group in 1D only.
    size_t globalWorkSize[2];
    int block_width = ( max_cols - 1 )/BLOCK_SIZE;

    //process top-left matrix
    //Does what the 1st kernel loop does in a higher (block) level. i.e., takes care of blocks of BLOCK_SIZExBLOCK_SIZE in a wave-front pattern upwards
    //the main anti-diagonal (on block-level).
    //Each iteration takes care of 1, 2, 3, ... blocks that can be computed in parallel w/o dependencies
    //E.g. first block [0][0], then blocks [0][1] and [1][0], then [0][2], [1][1], [2][0], etc.
    for(i = 1 ; i <= block_width ; i++){
      globalWorkSize[0] = i*localWorkSize[0]; //i.e., for 1st iteration BLOCK_SIZE total (=1 W.G.), for 2nd iteration 2*BLOCK_SIZE total work items
      // (=2 W.G.)
      globalWorkSize[1] = localWorkSize[1];
      errcode = clSetKernelArg(clKernel_nw1, 0, sizeof(cl_mem), (void *) &reference_d);
      errcode |= clSetKernelArg(clKernel_nw1, 1, sizeof(cl_mem), (void *) &matrix_d);
      errcode |= clSetKernelArg(clKernel_nw1, 2, sizeof(int), (void *) &max_cols);
      errcode |= clSetKernelArg(clKernel_nw1, 3, sizeof(int), (void *) &penalty);
      errcode |= clSetKernelArg(clKernel_nw1, 4, sizeof(int), (void *) &i);
      errcode |= clSetKernelArg(clKernel_nw1, 5, sizeof(int), (void *) &block_width);
      CHKERR(errcode, "Failed to set kernel arguments!");
      errcode = clEnqueueNDRangeKernel(commands, clKernel_nw1, 2, NULL, globalWorkSize, localWorkSize, 0, NULL, &ocdTempEvent);
      clFinish(commands);
      CHKERR(errcode, "Failed to enqueue kernel!");
    }

    //process bottom-right matrix
    //Does what the 2nd kernel loop does in a higher (block) level. i.e., takes care of blocks of BLOCK_SIZExBLOCK_SIZE in a wave-front pattern downwards
    //the main anti-diagonal.
    //Each iteration takes care of ..., 3, 2, 1 blocks that can be computed in parallel w/o dependencies
    for(i = block_width - 1  ; i >= 1 ; i--){
      globalWorkSize[0] = i*localWorkSize[0];
      globalWorkSize[1] = localWorkSize[1];
      errcode = clSetKernelArg(clKernel_nw2, 0, sizeof(cl_mem), (void *) &reference_d);
      errcode |= clSetKernelArg(clKernel_nw2, 1, sizeof(cl_mem), (void *) &matrix_d);
      errcode |= clSetKernelArg(clKernel_nw2, 2, sizeof(int), (void *) &max_cols);
      errcode |= clSetKernelArg(clKernel_nw2, 3, sizeof(int), (void *) &penalty);
      errcode |= clSetKernelArg(clKernel_nw2, 4, sizeof(int), (void *) &i);
      errcode |= clSetKernelArg(clKernel_nw2, 5, sizeof(int), (void *) &block_width);
      CHKERR(errcode, "Failed to set kernel arguments!");
      errcode = clEnqueueNDRangeKernel(commands, clKernel_nw2, 2, NULL, globalWorkSize, localWorkSize, 0, NULL, &ocdTempEvent);
      clFinish(commands);
      CHKERR(errcode, "Failed to enqueue kernel!");
    }

    errcode = clEnqueueReadBuffer(commands, matrix_d, CL_TRUE, 0, sizeof(float)*size, (void *) input_itemsets, 0, NULL, &ocdTempEvent);
    clFinish(commands);
    CHKERR(errcode, "Failed to enqueue read buffer!");

    clReleaseMemObject(reference_d);
    clReleaseMemObject(matrix_d);
    clReleaseKernel(clKernel_nw1);
    clReleaseKernel(clKernel_nw2);
    clReleaseProgram(clProgram);
    clReleaseCommandQueue(commands);
    clReleaseContext(context);

    t2 = gettime();

    // Reconstruct the aligned sequences starting from the last items of each
    // sequence.
    aligned_index_1 = aligned_seq_size - 1;
    aligned_index_2 = aligned_seq_size - 1;

    if (print_results) fprintf(stderr, "Trace solution back\n");
    // Start tracing through the results from the last computed value, when all
    // items have been exhausted for both sequences (in the right bottom corner),
    // up to the beginning of both sequences (on the top left corner).
    for (i = max_rows - 1,  j = max_cols - 1; !(i==0 && j==0);){
        // Recompute which of the previous values, relative to the current position, led
        // to our current maximum value
        if ( i > 0 && j > 0 ){
            nw = input_itemsets[input_index(i-1,j-1)] + reference[input_index(i,j)];
            w  = input_itemsets[input_index(i,j-1)] - penalty;
            n  = input_itemsets[input_index(i-1,j)] - penalty;
            n_limit = 0;
            w_limit = 0;
            traceback = maximum(nw, w, n);
        } else if ( i == 0 ){
            n_limit = 1;
            w_limit = 0;
        } else if ( j == 0 ){
            n_limit = 0;
            w_limit = 1;
        } else{ fprintf(stderr, "ERROR\n"); exit(1); }

        if(n_limit == 0 && w_limit == 0 && traceback == nw) {
            // Add the matching items to each of the aligned sequences
            // and move iterators to the previous items
            aligned_seq_1[aligned_index_1--] = input_seq_1[i--];
            aligned_seq_2[aligned_index_2--] = input_seq_2[j--];
        }
        else if(n_limit == 1 || traceback == w) {
            // Introduce a gap in the first aligned sequence,
            // add the corresponding item in the second sequence,
            // and move the second iterator
            aligned_index_1--;
            aligned_seq_2[aligned_index_2--] = input_seq_2[j--];
        }
        else if(w_limit == 1 || traceback == n) {
            // Introduce a gap in the second aligned sequence,
            // add the corresponding item in the first sequence,
            // and move the first iterator
            aligned_index_2--;
            aligned_seq_1[aligned_index_1--] = input_seq_1[i--];
        } else { fprintf(stderr, "ERROR\n"); exit(1); }
    }

    if (print_results) {
        // Print the input sequences and the resulting aligned sequences.
        // Convert the integer values for items to characters for legibility.
        fprintf(stderr, "Input Seq 1  :");
        for (i=1; i < max_rows; ++i) {
            fprintf(stderr, "%c", to_char(input_seq_1[i]));
        }
        fprintf(stderr, "\n");

        fprintf(stderr, "Input Seq 2  :");
        for (j=1; j < max_cols; ++j) {
            fprintf(stderr, "%c", to_char(input_seq_2[j]));
        }
        fprintf(stderr, "\n");

        fprintf(stderr, "Aligned Seq 1:");
        for (i=0; i < aligned_seq_size; ++i) {
            fprintf(stderr, "%c", to_char(aligned_seq_1[i]));
        }
        fprintf(stderr, "\n");
        fprintf(stderr, "Aligned Seq 2:");
        for (j=0; j < aligned_seq_size; ++j) {
            fprintf(stderr, "%c", to_char(aligned_seq_2[j]));
        }
        fprintf(stderr, "\n");

        if (print_intermediary_results) {
            for (i=0; i<max_rows; ++i) {
                for (j=0; j<max_cols; ++j) {
                    fprintf(stderr, "%c%.2d ", input_itemsets[input_index(i,j)] >= 0 ? '+' : '-', abs(input_itemsets[input_index(i,j)]));
                }
                fprintf(stderr, "\n");
            }
        }
    }

    if (input_seq_1_size == 4096 && input_seq_2_size == 4096 && penalty == 1 && nb_possible_seq_items == 10) {
        if (!seq_equal(aligned_seq_1, expected_aligned_seq_1, aligned_seq_size, expected_aligned_seq_1_size)) {
            fprintf(stderr, "ERROR: the aligned sequence 1 is different from the values expected.\n");
            exit(1);
        }
        if (!seq_equal(aligned_seq_2, expected_aligned_seq_2, aligned_seq_size, expected_aligned_seq_2_size)) {
            fprintf(stderr, "ERROR: the aligned sequence 2 is different from the values expected.\n");
            exit(1);
        }
    } else {
        fprintf(stderr,
            "WARNING: No self-checking for dimension '%d', penalty '%d', and number of possible items '%d'\n",
            input_seq_1_size,
            penalty,
            nb_possible_seq_items
            );
    }

    free(reference);
    free(input_itemsets);
    free(input_seq_1);
    free(input_seq_2);
    free(aligned_seq_1);
    free(aligned_seq_2);
    free(expected_aligned_seq_1);
    free(expected_aligned_seq_2);

    printf("{ \"status\": %d, \"options\": \"-n %d -g %d\", \"time\": %f }\n", 1, input_seq_1_size, penalty, t2-t1);
}
