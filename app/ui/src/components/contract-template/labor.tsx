import React from "react";

export const getContentHtml = ({
  companyName,
  companyNameShort,
  companyLocation,
  companyLocationGroup,
  companyPhoneNumber,
  companyOwner,
  companyOwnerNationality,
  companyOwnerPosition,
  companyOwnerDOB,
  companyOwnerIdentityNumber,
  companyOwnerLocation,
  employeeFullName,
  employeeNationality,
  employeeDOB,
  employeeBirthLocation,
  employeeLocation,
  employeeIdentityNumber,
  employeeIdentityIssueDate,
  employeeIdentityCity,
  employeePosition,
  employeePositionDesc,
  employeeSalary,
  contractLaborType,
  StartDate,
  EndDate
}: {
  companyName: string;
  companyNameShort: string;
  companyLocation: string;
  companyLocationGroup: string;
  companyPhoneNumber: string;
  companyOwner: string;
  companyOwnerNationality: string;
  companyOwnerPosition: string;
  companyOwnerDOB: string;
  companyOwnerIdentityNumber: string;
  companyOwnerLocation: string;
  employeeFullName: string;
  employeeNationality: string;
  employeeDOB: string;
  employeeBirthLocation: string;
  employeeLocation: string;
  employeeIdentityNumber: string;
  employeeIdentityIssueDate: string;
  employeeIdentityCity: string;
  employeePosition: string;
  employeePositionDesc: string[];
  employeeSalary: string;
  contractLaborType: string;
  StartDate: string;
  EndDate: string;
}): string => `<style type="text/css">
    .awlist1 {
        list-style: none;
        counter-reset: awlistcounter5_0
    }

    .awlist1>li:before {
        content: '1.'counter(awlistcounter5_0) '.';
        counter-increment: awlistcounter5_0
    }

    .awlist2 {
        list-style: none;
        counter-reset: awlistcounter3_0
    }

    .awlist2>li:before {
        content: '3.1.'counter(awlistcounter3_0) '.';
        counter-increment: awlistcounter3_0
    }

    .awlist3 {
        list-style: none;
        counter-reset: awlistcounter7_0
    }

    .awlist3>li:before {
        content: '('counter(awlistcounter7_0, lower-roman) ')';
        counter-increment: awlistcounter7_0
    }

    .awlist4 {
        list-style: none;
        counter-reset: awlistcounter6_1 1
    }

    .awlist4>li:before {
        content: '3.'counter(awlistcounter6_1) '.';
        counter-increment: awlistcounter6_1
    }

    .awlist5 {
        list-style: none;
        counter-reset: awlistcounter4_2
    }

    .awlist5>li:before {
        content: '4.'counter(awlistcounter4_2) '.';
        counter-increment: awlistcounter4_2
    }

    .awlist6 {
        list-style: none;
        counter-reset: awlistcounter4_2 1
    }

    .awlist6>li:before {
        content: '4.'counter(awlistcounter4_2) '.';
        counter-increment: awlistcounter4_2
    }

    .awlist7 {
        list-style: none;
        counter-reset: awlistcounter26_0
    }

    .awlist7>li:before {
        content: '5.'counter(awlistcounter26_0) '.';
        counter-increment: awlistcounter26_0
    }
</style>
<div>
    <div style="text-align:center;">
        <table cellspacing="0" cellpadding="0" style="width:100%; margin-right:auto; margin-left:auto; border-collapse:collapse;">
            <tbody>
                <tr>
                    <td style="width:39.86%; padding-right:5.4pt; padding-left:5.4pt; vertical-align:top;">
                        <p style="margin-top:6pt; margin-bottom:6pt; text-align:justify; font-size:12.5pt;"><strong><span style="font-family:'Times New Roman';">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></strong><strong><span style="font-family:'Times New Roman';">`+ companyNameShort.toLocaleUpperCase() +`</span></strong></p>
                        <p style="margin-top:6pt; margin-bottom:6pt; text-align:justify; font-size:12.5pt;"><strong><span style="font-family:'Times New Roman';">&nbsp; &nbsp; &nbsp; &nbsp;Số/</span></strong><strong><em><span style="font-family:'Times New Roman';">No: 02064/2015/HĐLĐ</span></em></strong></p>
                    </td>
                    <td style="width:60.14%; padding-right:5.4pt; padding-left:5.4pt; vertical-align:top;">
                        <p style="margin-top:6pt; margin-bottom:6pt; text-align:center; font-size:12.5pt;"><strong><span style="font-family:'Times New Roman';">CỘNG H&Ograve;A X&Atilde; HỘI CHỦ NGHĨA VIỆT NAM</span></strong></p>
                        <p style="margin-top:6pt; margin-bottom:6pt; text-align:center; font-size:12.5pt;"><strong><span style="font-family:'Times New Roman';">Độc lập &ndash; Tự do &ndash; Hạnh ph&uacute;c</span></strong></p>
                        <p style="margin-top:6pt; margin-bottom:6pt; text-align:center; font-size:12.5pt;"><strong><span style="font-family:'Times New Roman';">-----------------------------------</span></strong></p>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
    <p style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:center; line-height:normal; font-size:16pt;"><strong><span style="font-family:'Times New Roman';">HỢP ĐỒNG LAO ĐỘNG</span></strong></p>
    <p style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:center; line-height:normal; font-size:12pt;"><strong><span style="font-family:'Times New Roman';">Số/</span></strong><strong><em><span style="font-family:'Times New Roman';">No: 02064/2015/HĐLĐ</span></em></strong></p>
    <p style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:center; line-height:normal; font-size:12.5pt;"><strong><span style="font-family:'Times New Roman';">&nbsp;</span></strong></p>
    <p style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><span style="font-family:'Times New Roman';">Ch&uacute;ng t&ocirc;i một b&ecirc;n l&agrave;:&nbsp;</span><strong><span style="font-family:'Times New Roman';"> `+ companyName.toLocaleUpperCase() +`</span></strong></p>
    <p style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><span style="font-family:'Times New Roman';">Địa chỉ: `+ companyLocation +`</span></p>
    <p style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><span style="font-family:'Times New Roman';">Điện thoại: `+ companyPhoneNumber +`</span></p>
    <p style="margin-top:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-family:serif; font-size:12.5pt; list-style-position:inside;"><span style="font-family:'Times New Roman';">Người đại diện &Ocirc;ng</span><span style="width:15.82pt; text-indent:0pt; font-family:'Times New Roman'; display:inline-block;"></span><span style="font-family:'Times New Roman';"> : </span><strong><span style="font-family:'Times New Roman';"> `+ companyOwner +`</span></strong></p>
    <p style="margin-top:0pt; margin-bottom:0pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><em><span style="font-family:'Times New Roman';">-</span></em><span style="width:3.49pt; font:7pt 'Times New Roman'; display:inline-block;">&nbsp;&nbsp;</span><span style="font-family:'Times New Roman';">Quốc tịch</span><span style="width:26.54pt; text-indent:0pt; font-family:'Times New Roman'; display:inline-block;">&nbsp;</span><span style="width:36pt; text-indent:0pt; font-family:'Times New Roman'; display:inline-block;">&nbsp;</span><span style="font-family:'Times New Roman';">: `+ companyOwnerNationality +`</span></p>
    <p style="margin-top:0pt; margin-bottom:0pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><em><span style="font-family:'Times New Roman';">-</span></em><span style="width:3.49pt; font:7pt 'Times New Roman'; display:inline-block;">&nbsp;&nbsp;</span><span style="font-family:'Times New Roman';">Chức vụ</span><span style="width:32.95pt; text-indent:0pt; font-family:'Times New Roman'; display:inline-block;">&nbsp;</span><span style="width:36pt; text-indent:0pt; font-family:'Times New Roman'; display:inline-block;">&nbsp;</span><span style="font-family:'Times New Roman';">: `+ companyOwnerPosition +`</span></p>
    <p style="margin-top:0pt; margin-bottom:0pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><em><span style="font-family:'Times New Roman';">-</span></em><span style="width:3.49pt; font:7pt 'Times New Roman'; display:inline-block;">&nbsp;&nbsp;</span><span style="font-family:'Times New Roman';">Sinh ng&agrave;y</span><span style="width:25.14pt; text-indent:0pt; font-family:'Times New Roman'; display:inline-block;">&nbsp;</span><span style="width:36pt; text-indent:0pt; font-family:'Times New Roman'; display:inline-block;">&nbsp;</span><span style="font-family:'Times New Roman';">: `+ companyOwnerDOB +`</span></p>
    <p style="margin-top:0pt; margin-bottom:0pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><em><span style="font-family:'Times New Roman';">-</span></em><span style="width:3.49pt; font:7pt 'Times New Roman'; display:inline-block;">&nbsp;&nbsp;</span><span style="font-family:'Times New Roman';">Số CCCD</span><span style="width:25.12pt; text-indent:0pt; font-family:'Times New Roman'; display:inline-block;">&nbsp;</span><span style="width:36pt; text-indent:0pt; font-family:'Times New Roman'; display:inline-block;">&nbsp;</span><span style="font-family:'Times New Roman';">: `+ companyOwnerIdentityNumber +`</span></p>
    <p style="margin-top:0pt; margin-bottom:0pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><em><span style="font-family:'Times New Roman';">-</span></em><span style="width:3.49pt; font:7pt 'Times New Roman'; display:inline-block;">&nbsp;&nbsp;</span><span style="font-family:'Times New Roman';">Địa chỉ: `+ companyOwnerLocation +`</span></p>
    <p style="margin-top:0pt; margin-left:28.35pt; margin-bottom:0pt; text-align:center; line-height:normal; font-size:12.5pt;"><span style="font-family:'Times New Roman';">(Sau đ&acirc;y gọi l&agrave; &lsquo;người sử dụng lao động&rsquo; hay &lsquo;c&ocirc;ng ty&rsquo;)</span></p>
    <p style="text-indent:28.35pt; text-align:justify; line-height:normal; font-family:serif; font-size:12.5pt; list-style-position:inside;"><span style="font-family:'Times New Roman';">V&agrave; một b&ecirc;n l&agrave; &Ocirc;ng/B&agrave;:</span><strong><span style="font-family:'Times New Roman';"> `+ employeeFullName +`</span></strong><strong><span style="width:5.91pt; text-indent:0pt; font-family:'Times New Roman'; display:inline-block;">&nbsp;</span></strong></p>
    <p style="margin-top:0pt; margin-bottom:0pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><em><span style="font-family:'Times New Roman';">-</span></em><span style="width:3.49pt; font:7pt 'Times New Roman'; display:inline-block;">&nbsp;&nbsp;</span><span style="font-family:'Times New Roman';">Quốc tịch: `+ employeeNationality +`</span></p>
    <p style="margin-top:0pt; margin-bottom:0pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><em><span style="font-family:'Times New Roman';">-</span></em><span style="width:3.49pt; font:7pt 'Times New Roman'; display:inline-block;">&nbsp;&nbsp;</span><span style="font-family:'Times New Roman';">Sinh ng&agrave;y: `+ employeeDOB +`</span><span style="width:33.6pt; text-indent:0pt; font-family:'Times New Roman'; display:inline-block;">&nbsp;</span><span style="width:36pt; text-indent:0pt; font-family:'Times New Roman'; display:inline-block;">&nbsp;</span><span style="font-family:'Times New Roman';">tại: `+ employeeBirthLocation +`</span></p>
    <p style="margin-top:0pt; margin-bottom:0pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><em><span style="font-family:'Times New Roman';">-</span></em><span style="width:3.49pt; font:7pt 'Times New Roman'; display:inline-block;">&nbsp;&nbsp;</span><span style="font-family:'Times New Roman';">Địa chỉ thường tr&uacute;: `+ employeeLocation +`</span></p>
    <p style="margin-top:0pt; margin-bottom:6pt; text-indent:28.35pt; line-height:normal; font-size:12.5pt;"><em><span style="font-family:'Times New Roman';">-</span></em><span style="width:3.49pt; font:7pt 'Times New Roman'; display:inline-block;">&nbsp;&nbsp;</span><span style="font-family:'Times New Roman';">Số CMND: `+ employeeIdentityNumber +`</span><span style="width:30.81pt; text-indent:0pt; font-family:'Times New Roman'; display:inline-block;">&nbsp;</span><span style="font-family:'Times New Roman';">cấp ng&agrave;y `+ employeeIdentityIssueDate +`</span><span style="width:3.16pt; text-indent:0pt; font-family:'Times New Roman'; display:inline-block;">&nbsp;</span><span style="width:36pt; text-indent:0pt; font-family:'Times New Roman'; display:inline-block;">&nbsp;</span><span style="font-family:'Times New Roman';">tại: `+ employeeIdentityCity +`</span></p>
    <p style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:center; line-height:normal; font-size:12.5pt;"><span style="font-family:'Times New Roman';">(Sau đ&acirc;y gọi l&agrave; &lsquo;người lao động&rsquo;)</span></p>
    <p style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><span style="font-family:'Times New Roman';">C&ugrave;ng nhau thỏa thuận k&yacute; kết hợp đồng Lao động v&agrave; cam kết l&agrave;m đ&uacute;ng những điều khoản sau đ&acirc;y:</span></p>
    <p style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><strong><u><span style="font-family:'Times New Roman';">Điều 1</span></u></strong><strong><span style="font-family:'Times New Roman';">: THỜI HẠN V&Agrave; C&Ocirc;NG VIỆC HỢP ĐỒNG</span></strong></p>
    <ol type="1" class="awlist1" style="margin:0pt; padding-left:0pt;">
        <li style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-family:'Times New Roman'; font-size:12.5pt; font-weight:bold; list-style-position:inside;"><span style="width:2.55pt; font:7pt 'Times New Roman'; display:inline-block;">&nbsp;&nbsp;</span>Loại hợp đồng lao động<span style="font-weight:normal;">: `+ contractLaborType +`</span><span style="font-weight:normal;">&nbsp;&nbsp;</span><span style="font-weight:normal;">Từ ng&agrave;y `+ StartDate +`</span>${EndDate != '' ? `<span style="font-weight:normal;">Dến ng&agrave;y `+ EndDate +`</span>`:``}</li>
    </ol>
    <p style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><strong><span style="font-family:'Times New Roman';">1.2</span></strong><span style="font-family:'Times New Roman';">.</span><span style="font-family:'Times New Roman';">&nbsp;&nbsp;</span><strong><span style="font-family:'Times New Roman';">Địa điểm l&agrave;m việc</span></strong><span style="font-family:'Times New Roman';">:&nbsp;</span></p>
    <p style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><span style="font-family:'Times New Roman';">a. Người lao động l&agrave;m việc tại nh&agrave; m&aacute;y của c&ocirc;ng ty `+ companyLocationGroup +`</span></p>
    <p style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><span style="font-family:'Times New Roman';">b.&nbsp;</span><span style="font-family:'Times New Roman';">&nbsp;</span><span style="font-family:'Times New Roman';">Người lao động l&agrave;m việc tại c&aacute;c địa điểm kh&aacute;c theo nhu</span><span style="font-family:'Times New Roman';">&nbsp;&nbsp;</span><span style="font-family:'Times New Roman';">cầu c&ocirc;ng việc tại từng thời điểm. theo điều động của Gi&aacute;m đốc c&ocirc;ng ty hoặc người quản l&yacute; trực tiếp.</span></p>
    <p style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; line-height:normal; font-size:12.5pt;"><strong><span style="font-family:'Times New Roman';">1.3</span></strong><span style="font-family:'Times New Roman';">.&nbsp;</span><strong><span style="font-family:'Times New Roman';">Chức danh chuy&ecirc;n m&ocirc;n/ Chức vụ:</span></strong><span style="font-family:'Times New Roman';"> `+ employeePosition +`</span></p>
    <p style="margin-top:0pt; margin-bottom:0pt; text-indent:28.35pt; text-align:justify; line-height:130%; font-size:12.5pt;"><strong><span style="font-family:'Times New Roman';">1.4.</span></strong><span style="font-family:'Times New Roman';">&nbsp;</span><strong><span style="font-family:'Times New Roman';">C&ocirc;ng việc phải l&agrave;m</span></strong><span style="font-family:'Times New Roman';">:&nbsp;</span></p>
    ${employeePositionDesc
        .map(
          (desc, index) => `
          <p style="margin-top:0pt; margin-bottom:0pt; text-indent:28.35pt; text-align:justify; line-height:130%; font-size:12.5pt;"><span style="font-family:'Times New Roman';">${index + 1}. ${desc}</span></p>
        `
        )
        .join("")}
    <p style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><strong><u><span style="font-family:'Times New Roman';">Điều 2</span></u></strong><strong><span style="font-family:'Times New Roman';">: THỜI GIỜ L&Agrave;M VIỆC.</span></strong></p>
    <p style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><strong><span style="font-family:'Times New Roman';">2.1 Thời giờ l&agrave;m việc</span></strong><span style="font-family:'Times New Roman';">.</span></p>
    <p style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><span style="font-family:'Times New Roman';"></span><span style="font-family:'Times New Roman';">Thời giờ l&agrave;m việc b&igrave;nh thường kh&ocirc;ng qu&aacute; 8 giờ trong 1 ng&agrave;y v&agrave; kh&ocirc;ng qu&aacute; 48 giờ trong 1 tuần.&nbsp;</span></p>
    <p style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><span style="font-family:'Times New Roman';">Người sử dụng lao động c&oacute; thể huy động người lao động l&agrave;m th&ecirc;m giờ theo Bộ Luật Lao Động hiện h&agrave;nh tr&ecirc;n cơ sở tự nguyện của người lao động v&agrave; Thỏa ước lao động tập thể của C&ocirc;ng ty</span></p>
    <p style="margin-top:0pt; margin-bottom:0pt; text-indent:28.35pt; text-align:justify; line-height:115%; font-size:12.5pt;"><strong><span style="font-family:'Times New Roman';">2.2</span></strong><span style="font-family:'Times New Roman';">&nbsp;</span><strong><span style="font-family:'Times New Roman';">C&ocirc;ng cụ lao động:&nbsp;</span></strong></p>
    <p style="margin-top:0pt; margin-bottom:0pt; text-indent:28.35pt; text-align:justify; line-height:115%; font-size:12.5pt;"><span style="font-family:'Times New Roman';">Người lao động được cấp ph&aacute;t c&aacute;c c&ocirc;ng cụ l&agrave;m việc theo y&ecirc;u cầu của c&ocirc;ng việc v&agrave; quy định của C&ocirc;ng ty để thực hiện nhiệm vụ được giao. Người lao động c&oacute; tr&aacute;ch nhiệm bảo vệ t&agrave;i sản của C&ocirc;ng ty theo đ&uacute;ng quy định của Nội quy lao động của C&ocirc;ng ty.</span></p>
    <br>
    <p style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><strong><u><span style="font-family:'Times New Roman';">Điều 3</span></u></strong><strong><span style="font-family:'Times New Roman';">: NGHĨA VỤ V&Agrave; QUYỀN LỢI CỦA NGƯỜI LAO ĐỘNG</span></strong></p>
    <p style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><span style="font-family:'Times New Roman';">3.1</span><strong><span style="font-family:'Times New Roman';">.&nbsp;</span></strong><strong><span style="width:21.78pt; text-indent:0pt; font-family:'Times New Roman'; display:inline-block;">&nbsp;</span></strong><strong><span style="font-family:'Times New Roman';">Quyền lợi</span></strong></p>
    <ol type="1" class="awlist2" style="margin:0pt; padding-left:0pt;">
        <li style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-family:'Times New Roman'; font-size:12.5pt; list-style-position:inside;"><span style="width:15.52pt; font:7pt 'Times New Roman'; display:inline-block;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>Phương tiện đi lại l&agrave;m việc: Người lao động tự t&uacute;c</li>
    </ol>
    <p style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><span style="font-family:'Times New Roman';">3.1.2.</span><span style="width:15.52pt; text-indent:0pt; font-family:'Times New Roman'; display:inline-block;">&nbsp;</span><span style="font-family:'Times New Roman';">Nơi ở: Người lao động tự t&uacute;c</span></p>
    <p style="margin-top:0pt; margin-bottom:0pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><span style="font-family:'Times New Roman';">3.1.3.</span><span style="font-family:'Times New Roman';">&nbsp;&nbsp;&nbsp;&nbsp;</span><span style="font-family:'Times New Roman';">Tiền lương</span><em><span style="font-family:'Times New Roman';">:</span></em><span style="font-family:'Times New Roman';">&nbsp;C&ocirc;ng ty &aacute;p dụng mức lương tối thiểu v&ugrave;ng theo quy định của Ch&iacute;nh phủ. Khi c&oacute; sự thay đổi, l&uacute;c đ&oacute; C&ocirc;ng ty sẽ th&ocirc;ng b&aacute;o tới người lao động.</span></p>
    <ol type="i" class="awlist3" style="margin:0pt; padding-left:0pt;">
        <li style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-family:'Times New Roman'; font-size:12.5pt; font-style:italic; list-style-position:inside;"><span style="width:31.85pt; font:7pt 'Times New Roman'; display:inline-block;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span><span style="font-style:normal;">- Mức lương theo c&ocirc;ng việc&nbsp;</span><strong><span style="font-style:normal;"> `+ employeeSalary +`</span></strong><span style="font-style:normal;">&nbsp;đồng/th&aacute;ng</span></li>
    </ol>
    <p style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><span style="width:7.65pt; text-indent:0pt; font-family:'Times New Roman'; display:inline-block;">&nbsp;</span><span style="width:36pt; text-indent:0pt; font-family:'Times New Roman'; display:inline-block;">&nbsp;</span><span style='font-size:17px;line-height:115%;font-family:"Times New Roman";'>- Tiền chế độ tạm t&iacute;nh (tiền tr&aacute;ch nhiệm) đối với NLĐ khối gi&aacute;n tiếp được t&iacute;nh theo hiệu quả c&ocirc;ng việc l&agrave;m ra v&agrave; kh&ocirc;ng vi phạm c&aacute;c quy định, nội quy, quy chế của c&ocirc;ng ty</span></p>
    <p style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; line-height:normal; font-size:12.5pt;"><span style="width:7.65pt; text-indent:0pt; font-family:'Times New Roman'; display:inline-block;">&nbsp;</span><span style="width:36pt; text-indent:0pt; font-family:'Times New Roman'; display:inline-block;">&nbsp;</span><span style="font-family:'Times New Roman';">- C&aacute;c khoản hỗ trợ kh&aacute;c như hỗ trợ tiền ăn bữa trưa tại c&ocirc;ng ty trong những ng&agrave;y l&agrave;m việc thực tế tại C&ocirc;ng ty, tiền b&agrave; bầu, con thơ, hỗ trợ kh&aacute;c theo ng&agrave;y c&ocirc;ng.</span></p>
    <p style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><span style="width:7.65pt; text-indent:0pt; font-family:'Times New Roman'; display:inline-block;">&nbsp;</span><span style="font-family:'Times New Roman';">(ii) Thưởng kh&aacute;c bao gồm thưởng cuối năm: T&ugrave;y thuộc v&agrave;o kết quả sản xuất, kinh doanh, năng lực t&agrave;i ch&iacute;nh của c&ocirc;ng ty h&agrave;ng năm v&agrave; mức độ ho&agrave;n th&agrave;nh c&ocirc;ng việc của người lao động. Điều kiện hưởng v&agrave; thời gian hưởng theo quy định của c&ocirc;ng ty t&ugrave;y từng thời điểm.</span></p>
    <p style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><span style="font-family:'Times New Roman';">&nbsp;</span><span style="font-family:'Times New Roman';">(iii) Người lao động tự nguyện uỷ quyền cho C&ocirc;ng ty c&oacute; tr&aacute;ch nhiệm khấu trừ tr&iacute;ch từ tiền lương của người lao động nộp c&aacute;c khoản đ&oacute;ng BHXH, BHYT, BHTN, thuế thu nhập c&aacute; nh&acirc;n, cũng như c&aacute;c khoản đ&oacute;ng kh&aacute;c theo quy định của ph&aacute;p luật.</span></p>
    <p style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><span style="font-family:'Times New Roman';">3.1.4.</span><span style="width:15.52pt; text-indent:0pt; font-family:'Times New Roman'; display:inline-block;">&nbsp;</span><span style="font-family:'Times New Roman';">H&igrave;nh thức trả lương: Trả lương theo thời gian.</span></p>
    <p style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><span style="font-family:'Times New Roman';">Thời hạn trả lương: được trả lương v&agrave;o ng&agrave;y 15 đến ng&agrave;y 20 h&agrave;ng th&aacute;ng bằng chuyển khoản v&agrave; t&ugrave;y theo th&ocirc;ng b&aacute;o của c&ocirc;ng ty tại từng thời điểm.</span></p>
    <p style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><span style="font-family:'Times New Roman';">3.1.5.</span><span style="font-family:'Times New Roman';">&nbsp;&nbsp;&nbsp;&nbsp;</span><span style="font-family:'Times New Roman';">Chế độ n&acirc;ng lương: Theo quy định của c&ocirc;ng ty v&agrave; dựa tr&ecirc;n cơ sở đ&aacute;nh gi&aacute; năng lực l&agrave;m việc của người</span><span style="font-family:'Times New Roman';">&nbsp;&nbsp;</span><span style="font-family:'Times New Roman';">lao động .</span></p>
    <p style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><span style="font-family:'Times New Roman';">3.1.6. Được trang bị bảo hộ lao động cần thiết cho c&ocirc;ng việc v&agrave; theo quy định của C&ocirc;ng ty tại từng thời điểm.</span></p>
    <p style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><span style="font-family:'Times New Roman';">3.1.7. Chế độ nghỉ ngơi</span></p>
    <p style="margin-top:6pt; margin-bottom:0pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><em><span style="font-family:'Times New Roman';">-</span></em><span style="width:3.49pt; font:7pt 'Times New Roman'; display:inline-block;">&nbsp;&nbsp;</span><span style="font-family:'Times New Roman';">Nghỉ hằng tuần kh&ocirc;ng hưởng lương v&agrave;o ng&agrave;y chủ nhật; trường hợp đặc biệt do chu k&igrave; lao động kh&ocirc;ng thể nghỉ hằng tuần, c&ocirc;ng ty sắp xếp cho người lao động nghỉ b&igrave;nh qu&acirc;n 1 th&aacute;ng &iacute;t nhất 4 ng&agrave;y.</span></p>
    <p style="margin-top:0pt; margin-bottom:0pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><em><span style="font-family:'Times New Roman';">-</span></em><span style="width:3.49pt; font:7pt 'Times New Roman'; display:inline-block;">&nbsp;&nbsp;</span><span style="font-family:'Times New Roman';">Nghỉ ph&eacute;p hằng năm hưởng nguy&ecirc;n lương</span><em><span style="font-family:'Times New Roman';">:&nbsp;</span></em><span style="font-family:'Times New Roman';">c&oacute; đủ 12 th&aacuteng l&agrave;m việc th&igrave; được nghỉ 12 ng&agrave;y ph&eacute;p hằng năm/năm đối với người l&agrave;m c&ocirc;ng việc trong điều kiện b&igrave;nh thường; 14 ng&agrave;y l&agrave;m việc đối với người lao động chưa th&agrave;nh ni&ecirc;n, lao động l&agrave; người khuyết tật, người l&agrave;m nghề, c&ocirc;ng việc nặng nhọc, độc hại, nguy hiểm; dưới 12 th&aacute;ng l&agrave;m việc th&igrave; thời gian nghỉ ph&eacute;p hằng năm t&iacute;nh theo tỷ lệ tương ứng với số thời gian l&agrave;m việc; l&agrave;m việc từ 5 năm trở l&ecirc;n tại c&ocirc;ng ty th&igrave; nghỉ th&ecirc;m 1 ng&agrave;y.</span></p>
    <p style="margin-top:0pt; margin-bottom:0pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><em><span style="font-family:'Times New Roman';">-</span></em><span style="width:3.49pt; font:7pt 'Times New Roman'; display:inline-block;">&nbsp;&nbsp;</span><span style="font-family:'Times New Roman';">Nghỉ Lễ, Tết: 11 ng&agrave;y/năm c&oacute; hưởng lương (1 ng&agrave;y Tết dương lịch, 5 ng&agrave;y Tết &acirc;m lịch, 1 ng&agrave;y giỗ Tổ H&ugrave;ng Vương, 01 ng&agrave;y chiến thắng, 01 ng&agrave;y quốc tế lao động, 2 ng&agrave;y Quốc kh&aacute;nh).</span></p>
    <p style="margin-top:0pt; margin-bottom:0pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><em><span style="font-family:'Times New Roman';">-</span></em><span style="width:3.49pt; font:7pt 'Times New Roman'; display:inline-block;">&nbsp;&nbsp;</span><span style="font-family:'Times New Roman';">Nghỉ việc ri&ecirc;ng c&oacute; hưởng</span><span style="font-family:'Times New Roman';">&nbsp;&nbsp;</span><span style="font-family:'Times New Roman';">lương: bản th&acirc;n kết h&ocirc;n nghỉ 3 ng&agrave;y; con đẻ, con nu&ocirc;i kết h&ocirc;n nghỉ 1 ng&agrave;y;</span><span style="font-family:'Times New Roman';">&nbsp;&nbsp;</span><span style="font-family:'Times New Roman';">con đẻ, mẹ đẻ, cha nu&ocirc;i, mẹ nu&ocirc;i; cha đẻ, mẹ đẻ, con nu&ocirc;i, mẹ nu&ocirc;i của vợ hoặc chồng; vợ hoặc chồng; con đẻ, con nu&ocirc;i chết: nghỉ 3 ng&agrave;y</span><span style="font-family:'Times New Roman';">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></p>
    <p style="margin-top:0pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><em><span style="font-family:'Times New Roman';">-</span></em><span style="width:3.49pt; font:7pt 'Times New Roman'; display:inline-block;">&nbsp;&nbsp;</span><span style="font-family:'Times New Roman';">&nbsp;Nghỉ việc ri&ecirc;ng kh&ocirc;ng hưởng lương: 1 ng&agrave;y v&agrave; phải th&ocirc;ng b&aacute;o với c&ocirc;ng ty khi &ocirc;ng nội, b&agrave; nội, &ocirc;ng ngoại, b&agrave; ngoại, anh, chị, em ruột chết; bố hoặc mẹ kết h&ocirc;n; anh, chị, em ruột kết h&ocirc;n.</span></p>
    <p style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><span style="font-family:'Times New Roman';">3.1.8.</span><span style="width:15.52pt; text-indent:0pt; font-family:'Times New Roman'; display:inline-block;">&nbsp;</span><span style="font-family:'Times New Roman';">Bảo hiểm X&atilde; hội, bảo hiểm Y tế v&agrave; bảo hiểm Thất nghiệp</span><em><span style="font-family:'Times New Roman';">:</span></em></p>
    <p style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><span style="font-family:'Times New Roman';">H&agrave;ng th&aacute;ng, c&ocirc;ng ty đ&oacute;ng Bảo hiểm X&atilde; hội, bảo hiểm Y tế, bảo hiểm Thất nghi&ecirc;p dựa theo tiền lương th&aacute;ng của người lao động tr&ecirc;n quỹ tiền lương của c&ocirc;ng ty v&agrave; tr&iacute;ng từ tiền lương th&aacute;ng của người lao động để đ&oacute;ng v&agrave;o quỹ bảo hiểm theo mức như sau:</span></p>
    <br>
    <table cellspacing="0" cellpadding="0" style="width:100%; border:0.75pt solid #000000; border-collapse:collapse;">
        <tbody>
            <tr>
                <td style="width:8.14%; border-right-style:solid; border-right-width:0.75pt; border-bottom-style:solid; border-bottom-width:0.75pt; padding-right:5.03pt; padding-left:5.03pt; vertical-align:middle;">
                    <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; font-size:12.5pt;"><strong><span style="font-family:'Times New Roman';">STT</span></strong></p>
                </td>
                <td style="width:29.7%; border-right-style:solid; border-right-width:0.75pt; border-left-style:solid; border-left-width:0.75pt; border-bottom-style:solid; border-bottom-width:0.75pt; padding-right:5.03pt; padding-left:5.03pt; vertical-align:middle;">
                    <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; font-size:12.5pt;"><strong><span style="font-family:'Times New Roman';">Mức ph&iacute;</span></strong></p>
                    <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; font-size:12.5pt;"><strong><em><span style="font-family:'Times New Roman';">&nbsp;</span></em></strong></p>
                </td>
                <td style="width:28.28%; border-right-style:solid; border-right-width:0.75pt; border-left-style:solid; border-left-width:0.75pt; border-bottom-style:solid; border-bottom-width:0.75pt; padding-right:5.03pt; padding-left:5.03pt; vertical-align:middle;">
                    <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; font-size:12.5pt;"><strong><span style="font-family:'Times New Roman';">C&ocirc;ng ty đ&oacute;ng</span></strong><strong><em><span style="font-family:'Times New Roman';">&nbsp;(%)</span></em></strong></p>
                </td>
                <td style="width:33.88%; border-left-style:solid; border-left-width:0.75pt; border-bottom-style:solid; border-bottom-width:0.75pt; padding-right:5.03pt; padding-left:5.03pt; vertical-align:middle;">
                    <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; font-size:12.5pt;"><strong><span style="font-family:'Times New Roman';">Người lao động tr&iacute;ch nộp</span></strong><strong><em><span style="font-family:'Times New Roman';">&nbsp;(%)</span></em></strong></p>
                </td>
            </tr>
            <tr>
                <td style="width:8.14%; border-top-style:solid; border-top-width:0.75pt; border-right-style:solid; border-right-width:0.75pt; border-bottom-style:solid; border-bottom-width:0.75pt; padding-right:5.03pt; padding-left:5.03pt; vertical-align:middle;">
                    <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; font-size:12.5pt;"><span style="font-family:'Times New Roman';">1</span></p>
                </td>
                <td style="width:29.7%; border-style:solid; border-width:0.75pt; padding-right:5.03pt; padding-left:5.03pt; vertical-align:middle;">
                    <p style="margin-top:0pt; margin-bottom:0pt; text-align:justify; font-size:12.5pt;"><span style="font-family:'Times New Roman';">Bảo hiểm X&atilde; hội</span></p>
                </td>
                <td style="width:28.28%; border-style:solid; border-width:0.75pt; padding-right:5.03pt; padding-left:5.03pt; vertical-align:middle;">
                    <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; font-size:12.5pt;"><span style="font-family:'Times New Roman';">17.5</span></p>
                </td>
                <td style="width:33.88%; border-top-style:solid; border-top-width:0.75pt; border-left-style:solid; border-left-width:0.75pt; border-bottom-style:solid; border-bottom-width:0.75pt; padding-right:5.03pt; padding-left:5.03pt; vertical-align:middle;">
                    <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; font-size:12.5pt;"><span style="font-family:'Times New Roman';">8</span></p>
                </td>
            </tr>
            <tr>
                <td style="width:8.14%; border-top-style:solid; border-top-width:0.75pt; border-right-style:solid; border-right-width:0.75pt; border-bottom-style:solid; border-bottom-width:0.75pt; padding-right:5.03pt; padding-left:5.03pt; vertical-align:middle;">
                    <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; font-size:12.5pt;"><span style="font-family:'Times New Roman';">2</span></p>
                </td>
                <td style="width:29.7%; border-style:solid; border-width:0.75pt; padding-right:5.03pt; padding-left:5.03pt; vertical-align:middle;">
                    <p style="margin-top:0pt; margin-bottom:0pt; text-align:justify; font-size:12.5pt;"><span style="font-family:'Times New Roman';">Bảo hiểm Y tế</span></p>
                </td>
                <td style="width:28.28%; border-style:solid; border-width:0.75pt; padding-right:5.03pt; padding-left:5.03pt; vertical-align:middle;">
                    <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; font-size:12.5pt;"><span style="font-family:'Times New Roman';">3</span></p>
                </td>
                <td style="width:33.88%; border-top-style:solid; border-top-width:0.75pt; border-left-style:solid; border-left-width:0.75pt; border-bottom-style:solid; border-bottom-width:0.75pt; padding-right:5.03pt; padding-left:5.03pt; vertical-align:middle;">
                    <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; font-size:12.5pt;"><span style="font-family:'Times New Roman';">1.5</span></p>
                </td>
            </tr>
            <tr>
                <td style="width:8.14%; border-top-style:solid; border-top-width:0.75pt; border-right-style:solid; border-right-width:0.75pt; border-bottom-style:solid; border-bottom-width:0.75pt; padding-right:5.03pt; padding-left:5.03pt; vertical-align:middle;">
                    <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; font-size:12.5pt;"><span style="font-family:'Times New Roman';">3</span></p>
                </td>
                <td style="width:29.7%; border-style:solid; border-width:0.75pt; padding-right:5.03pt; padding-left:5.03pt; vertical-align:middle;">
                    <p style="margin-top:0pt; margin-bottom:0pt; text-align:justify; font-size:12.5pt;"><span style="font-family:'Times New Roman';">Bảo hiểm Thất nghiệp</span></p>
                </td>
                <td style="width:28.28%; border-style:solid; border-width:0.75pt; padding-right:5.03pt; padding-left:5.03pt; vertical-align:middle;">
                    <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; font-size:12.5pt;"><span style="font-family:'Times New Roman';">1</span></p>
                </td>
                <td style="width:33.88%; border-top-style:solid; border-top-width:0.75pt; border-left-style:solid; border-left-width:0.75pt; border-bottom-style:solid; border-bottom-width:0.75pt; padding-right:5.03pt; padding-left:5.03pt; vertical-align:middle;">
                    <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; font-size:12.5pt;"><span style="font-family:'Times New Roman';">1</span></p>
                </td>
            </tr>
            <tr>
                <td colspan="2" style="border-top-style:solid; border-top-width:0.75pt; border-right-style:solid; border-right-width:0.75pt; padding-right:5.03pt; padding-left:5.03pt; vertical-align:middle;">
                    <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; font-size:12.5pt;"><strong><span style="font-family:'Times New Roman';">Tổng cộng</span></strong></p>
                </td>
                <td style="width:28.28%; border-top-style:solid; border-top-width:0.75pt; border-right-style:solid; border-right-width:0.75pt; border-left-style:solid; border-left-width:0.75pt; padding-right:5.03pt; padding-left:5.03pt; vertical-align:middle;">
                    <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; font-size:12.5pt;"><strong><span style="font-family:'Times New Roman';">21.5</span></strong></p>
                </td>
                <td style="width:33.88%; border-top-style:solid; border-top-width:0.75pt; border-left-style:solid; border-left-width:0.75pt; padding-right:5.03pt; padding-left:5.03pt; vertical-align:middle;">
                    <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; font-size:12.5pt;"><strong><span style="font-family:'Times New Roman';">10.5</span></strong></p>
                </td>
            </tr>
        </tbody>
    </table>
    <p style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><span style="font-family:'Times New Roman';">Những mức đ&oacute;ng tr&ecirc;n c&oacute; thể thay đổi theo quy định của ph&aacute;p luật Việt Nam.</span><em><span style="width:19.35pt; text-indent:0pt; font-family:'Times New Roman'; display:inline-block;">&nbsp;</span></em></p>
    <p style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><span style="font-family:'Times New Roman';">3.1.9.</span><span style="font-family:'Times New Roman';">&nbsp;&nbsp;</span><span style="font-family:'Times New Roman';">Chế độ đ&agrave;o tạo, n&acirc;ng cao: Theo y&ecirc;u cầu c&ocirc;ng việc v&agrave; quy định của c&ocirc;ng ty với c&aacute;c chi tiết trong thỏa</span><span style="font-family:'Times New Roman';">&nbsp;&nbsp;</span><span style="font-family:'Times New Roman';">thuận đ&agrave;o tạo, nếu c&oacute;.</span></p>
    <p style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><span style="font-family:'Times New Roman';">3.1.10.</span><span style="width:9.27pt; text-indent:0pt; font-family:'Times New Roman'; display:inline-block;">&nbsp;</span><span style="font-family:'Times New Roman';">Những thỏa thuận kh&aacute;c: Theo y&ecirc;u cầu c&ocirc;ng việc v&agrave; quy định của c&ocirc;ng ty.</span></p>
    <ol start="2" type="1" class="awlist4" style="margin:0pt; padding-left:0pt;">
        <li style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-family:'Times New Roman'; font-size:12.5pt; font-weight:bold; list-style-position:inside;"><span style="width:24.9pt; font:7pt 'Times New Roman'; display:inline-block;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>Nghĩa vụ</li>
    </ol>
    <p style="margin-top:0pt; margin-bottom:0pt; text-indent:36pt; text-align:justify; line-height:16pt;"><span style="font-family:'Times New Roman'; font-size:12.5pt;">3.2.1. Ho&agrave;n th&agrave;nh c&aacute;c c&ocirc;ng việc được giao như đ&atilde; cam kết, định mức lao động sản xuất, định mức ti&ecirc;u hao vật tư nguy&ecirc;n phụ liệu do C&ocirc;ng ty qui định.</span></p>
    <p style="margin-top:0pt; margin-bottom:0pt; text-indent:36pt; text-align:justify; line-height:16pt;"><span style="font-family:'Times New Roman'; font-size:12.5pt;">3.2.2.</span><span style="font-family:'Times New Roman'; font-size:12.5pt;">&nbsp;&nbsp;</span><span style="font-family:'Times New Roman'; font-size:12.5pt;">Chịu sự điều động, ph&acirc;n c&ocirc;ng của Gi&aacute;m đốc c&ocirc;ng ty, người quản l&yacute; trực tiếp.</span></p>
    <p style="margin-top:0pt; margin-bottom:0pt; text-indent:28.35pt; text-align:justify; line-height:16pt;"><span style="font-family:'Times New Roman'; font-size:12.5pt;">Chấp h&agrave;nh nghi&ecirc;m ch&iacute;nh nội quy lao động, kỷ luật lao động, c&aacute;c quy chế, ch&iacute;nh s&aacute;ch của C&ocirc;ng ty về điều h&agrave;nh, sản xuất kinh doanh, an to&agrave;n vệ sinh lao động, bảo hộ lao động, v.v v&agrave; Ph&aacute;p luật của Nh&agrave; nước.</span></p>
    <p style="margin-top:0pt; margin-bottom:0pt; text-indent:36pt; text-align:justify; line-height:16pt;"><span style="font-family:'Times New Roman'; font-size:12.5pt;">3.2.3. Thực hiện mọi c&ocirc;ng việc với tinh thần tr&aacute;ch nhiệm, sự tận tuỵ v&agrave; v&igrave; lợi &iacute;ch cao nhất của C&ocirc;ng ty.</span></p>
    <p style="margin-top:0pt; margin-bottom:0pt; text-indent:36pt; text-align:justify; line-height:16pt;"><span style="font-family:'Times New Roman'; font-size:12.5pt;">3.2.4. Bồi thường cho C&ocirc;ng ty, kh&aacute;ch h&agrave;ng hay bất bất kỳ b&ecirc;n thứ ba n&agrave;o mọi thiệt hại thực tế ph&aacute;t sinh do bất cứ h&agrave;nh vi cố &yacute; l&agrave;m tr&aacute;i, lỗi hay h&agrave;nh vi vượt thẩm quyền của m&igrave;nh g&acirc;y ra;</span></p>
    <p style="margin-top:0pt; margin-bottom:0pt; text-indent:36pt; text-align:justify; line-height:16pt;"><span style="font-family:'Times New Roman'; font-size:12.5pt;">3.2.5. Nộp c&aacute;c khoản thuế thu nhập c&aacute; nh&acirc;n, bảo hiểm x&atilde; hội, bảo hiểm y tế theo quy định hiện h&agrave;nh của Ph&aacute;p luật Việt Nam.</span></p>
    <p style="margin-top:0pt; margin-bottom:0pt; text-indent:36pt; text-align:justify; line-height:16pt;"><span style="font-family:'Times New Roman'; font-size:12.5pt;">3.2.6. Thực hiện c&aacute;c nghĩa vụ kh&aacute;c theo quy định của Ph&aacute;p luật về lao động của Nh&agrave; nước, nội quy, ch&iacute;nh s&aacute;ch của C&ocirc;ng ty.</span></p>
    <p style="margin-top:0pt; margin-bottom:0pt; text-indent:36pt; text-align:justify; line-height:16pt;"><span style="font-family:'Times New Roman'; font-size:12.5pt;">3.2.7. Thanh to&aacute;n đủ c&aacute;c khoản nợ, c&aacute;c khoản bồi thường cho C&ocirc;ng ty đ&uacute;ng thời hạn qui định của Hợp đồng, Hợp đồng đ&agrave;o tạo k&yacute; với C&ocirc;ng ty hay Quyết định bồi thường thiệt hại, nếu c&oacute;.</span></p>
    <p style="margin-top:0pt; margin-bottom:0pt; text-indent:36pt; text-align:justify; line-height:16pt;"><span style="font-family:'Times New Roman'; font-size:12.5pt;">3.2.8. Khi kh&ocirc;ng c&oacute; sự chấp thuận trước bằng văn bản của c&ocirc;ng ty, người lao động kh&ocirc;ng được tham gia trực tiếp hoặc gi&aacute;n tiếp v&agrave;o bất kỳ doanh nghiệp hoặc c&ocirc;ng việc tương tự, hoặc mang t&iacute;nh cạnh tranh với việc kinh doanh của c&ocirc;ng ty trong hoặc ngo&agrave;i giờ l&agrave;m việc của c&ocirc;ng ty.</span></p>
    <p style="margin-top:6pt; margin-bottom:6pt; text-indent:36pt; text-align:justify; line-height:normal; font-size:12.5pt;"><span style="font-family:'Times New Roman';">3.2.9.</span><em><span style="width:7.88pt; text-indent:0pt; font-family:'Times New Roman'; display:inline-block;">&nbsp;</span></em><span style="font-family:'Times New Roman';">Bảo mật</span></p>
    <p style="margin-top:0pt; margin-bottom:0pt; text-indent:28.35pt; text-align:justify; line-height:16pt;"><span style="font-family:'Times New Roman'; font-size:12.5pt;">- Giữ g&igrave;n bảo mật mọi b&iacute; mật kinh doanh của C&ocirc;ng ty bao gồm v&agrave; kh&ocirc;ng chỉ l&agrave;: Th&ocirc;ng tin sản xuất, kinh doanh, t&agrave;i ch&iacute;nh, định mức lao động, ti&ecirc;u hao vật tư; Th&ocirc;ng tin kh&aacute;ch h&agrave;ng. Ch&iacute;nh s&aacute;ch b&aacute;n h&agrave;ng, tiếp thị, ph&aacute;t triển sản phẩm; Nguồn cung cấp; C&aacute;c giao dịch &hellip;v.v..;</span></p>
    <p style="margin-top:0pt; margin-bottom:0pt; text-indent:28.35pt; text-align:justify; line-height:16pt;"><span style="font-family:'Times New Roman'; font-size:12.5pt;">- Người lao động sẽ kh&ocirc;ng sử dụng ri&ecirc;ng hay tiết lộ c&aacute;c b&iacute; mật kinh doanh của c&ocirc;ng ty nếu kh&ocirc;ng c&oacute; sự đồng &yacute; trước bằng văn bản của c&ocirc;ng ty. Người lao động cam kết đền b&ugrave; cho C&ocirc;ng ty theo quy định của Nội qui lao động nếu vi phạm điều n&agrave;y. Thỏa thuận n&agrave;y sẽ vẫn giữ nguy&ecirc;n hiệu lực ngay cả khi hợp đồng lao động n&agrave;y đ&atilde; chấm dứt.</span></p>
    <p style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><strong><span style="font-family:'Times New Roman';">&nbsp;</span></strong></p>
    <p style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><strong><u><span style="font-family:'Times New Roman';">Điều 4</span></u></strong><strong><span style="font-family:'Times New Roman';">: NGHĨA VỤ V&Agrave; QUYỀN HẠN CỦA NGƯỜI SỬ DỤNG LAO ĐỘNG</span></strong></p>
    <ol type="1" class="awlist5" style="margin:0pt; padding-left:0pt;">
        <li style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-family:'Times New Roman'; font-size:12.5pt; list-style-position:inside;"><span style="width:24.9pt; font:7pt 'Times New Roman'; display:inline-block;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span><strong>Nghĩa vụ</strong></li>
    </ol>
    <p style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><span style="font-family:'Times New Roman';">- Người sử dụng lao động cung cấp th&ocirc;ng tin trung thực cho người lao động về c&ocirc;ng việc, địa điểm l&agrave;m việc, điều kiện l&agrave;m việc, thời giờ l&agrave;m việc, thời giờ nghỉ ngơi, an to&agrave;n, vệ sinh lao động, tiền lương, h&igrave;nh thức trả lương, bảo hiểm x&atilde; hội, bảo hiểm y tế, bảo hiểm thất nghiệp, quy định về bảo vệ b&iacute; mật kinh doanh, bảo vệ b&iacute; mật c&ocirc;ng nghệ v&agrave; vấn đề kh&aacute;c li&ecirc;n quan trực tiếp đến việc giao kết hợp đồng lao động m&agrave; người lao động y&ecirc;u cầu.</span></p>
    <p style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><strong><span style="font-family:'Times New Roman';">-&nbsp;</span></strong><span style="font-family:'Times New Roman';">Bảo đảm việc l&agrave;m v&agrave; thực hiện đẩy đủ những điều đ&atilde; cam kết trong hợp đồng lao động v&agrave; thỏa ước lao động tập thể;&nbsp;</span></p>
    <p style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><strong><span style="font-family:'Times New Roman';">-&nbsp;</span></strong><span style="font-family:'Times New Roman';">Thanh to&aacute;n c&aacute;c chế độ v&agrave; quyền lợi cho người lao động theo hợp đồng lao động v&agrave; thỏa ước lao động tập thể.</span></p>
    <br>
    <ol start="2" type="1" class="awlist6" style="margin:0pt; padding-left:0pt;">
        <li style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-family:'Times New Roman'; font-size:12.5pt; list-style-position:inside;"><span style="width:24.9pt; font:7pt 'Times New Roman'; display:inline-block;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span><strong>Quyền hạn</strong></li>
    </ol>
    <p style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><strong><span style="font-family:'Times New Roman';">-&nbsp;</span></strong><span style="font-family:'Times New Roman';">Điều h&agrave;nh người lao động l&agrave;m việc theo hợp đồng lao động v&agrave; theo nhu cầu sản xuất kinh doanh của c&ocirc;ng ty (bố tr&iacute;, điều chuyển, tạm ngừng việc v.v);</span></p>
    <p style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><span style="font-family:'Times New Roman';">- Tạm ho&atilde;n, chuyển người lao động sang l&agrave;m c&ocirc;ng việc kh&aacute;c so với hợp đồng Lao động, chấm dứt hợp đồng lao động, kỷ luật người lao động theo quy định của ph&aacute;p luật lao động, thỏa ước Lao động tập thể v&agrave; nội quy Lao động c&ocirc;ng ty.</span></p>
    <p style="margin-top:0pt; margin-bottom:0pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><span style="font-family:'Times New Roman';">-</span><span style="width:3.49pt; font:7pt 'Times New Roman'; display:inline-block;">&nbsp;&nbsp;</span><span style="font-family:'Times New Roman';">Định k&igrave; đ&aacute;nh gi&aacute; kết quả l&agrave;m việc của người lao động, người sử dụng lao động c&oacute; quyền chấm dứt hợp đồng lao động khi người lao động thường xuy&ecirc;n kh&ocirc;ng ho&agrave;n th&agrave;nh c&ocirc;ng việc được giao.</span></p>
    <p style="margin-top:6pt; margin-bottom:6pt; text-align:justify; line-height:normal; font-size:12.5pt;"><strong><span style="font-family:'Times New Roman';">&nbsp;</span></strong></p>
    <p style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><strong><u><span style="font-family:'Times New Roman';">Điều 5</span></u></strong><strong><span style="font-family:'Times New Roman';">: ĐIỀU KHOẢN THI H&Agrave;NH</span></strong></p>
    <ol type="1" class="awlist7" style="margin:0pt; padding-left:0pt;">
        <li style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-family:'Times New Roman'; font-size:12.5pt; list-style-position:inside;"><span style="width:24.9pt; font:7pt 'Times New Roman'; display:inline-block;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>Những vấn đề về lao động kh&ocirc;ng được ghi trong hợp đồng Lao động n&agrave;y th&igrave; &aacute;p dụng quy định của thỏa ước Lao động tập thể, nội quy lao động, quy chế kh&aacute;c của c&ocirc;ng ty v&agrave; quy định của ph&aacute;p luật lao động.</li>
        <li style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-family:'Times New Roman'; font-size:12.5pt; list-style-position:inside;"><span style="width:24.9pt; font:7pt 'Times New Roman'; display:inline-block;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>Hợp đồng Lao động n&agrave;y được lập th&agrave;nh hai (2) bản c&oacute; gi&aacute; trị ngang nhau được đọc lại cho c&aacute;c b&ecirc;n nghe v&agrave; hiểu r&otilde;, đồng &yacute; v&agrave; c&ugrave;ng k&yacute; t&ecirc;n, mỗi b&ecirc;n giữ một bản gốc v&agrave; c&oacute; hiệu lực từ ng&agrave;y k&yacute;. Bất kỳ phụ lục hợp đồng n&agrave;o được hai b&ecirc;n k&yacute; kết đều tạo th&agrave;nh một bộ phận kh&ocirc;ng thể t&aacute;ch rời của bản hợp đồng Lao động n&agrave;y v&agrave; c&oacute; gi&aacute; trị như nội dung của bản hợp đồng Lao động n&agrave;y.</li>
    </ol>
    <p style="margin-top:6pt; margin-bottom:6pt; text-indent:28.35pt; text-align:justify; line-height:normal; font-size:12.5pt;"><span style="font-family:'Times New Roman';">Hợp đồng lao động n&agrave;y l&agrave;m tại C&ocirc;ng ty CP Nam Tiệp từ ng&agrave;y `+ new Date().getDate().toString() +` th&aacute;ng `+ new Date().getMonth().toString() +` năm `+ new Date().getFullYear().toString() +` ./.</span></p>
    <div style="text-align:center;">
        <table cellspacing="0" cellpadding="0" style="margin-right: auto; margin-left: auto; border-collapse: collapse; width: 100%;">
            <tbody>
                <tr style="height:151.25pt;">
                    <td style="width:233.8pt; padding-right:5.4pt; padding-left:5.4pt; vertical-align:top;">
                        <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; font-size:12.5pt;"><strong><span style="font-family:'Times New Roman';">NGƯỜI LAO ĐỘNG</span></strong></p>
                        <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; font-size:12.5pt;"><em><span style="font-family:'Times New Roman';">(K&yacute; t&ecirc;n/Ghi r&otilde; họ v&agrave; t&ecirc;n)</span></em></p>
                        <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; font-size:12.5pt;"><em><span style="font-family:'Times New Roman';">&nbsp;</span></em></p>
                        <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; font-size:12.5pt;"><em><span style="font-family:'Times New Roman';">&nbsp;</span></em></p>
                        <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; font-size:12.5pt;"><em><span style="font-family:'Times New Roman';">&nbsp;</span></em></p>
                        <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; font-size:12.5pt;"><em><span style="font-family:'Times New Roman';">&nbsp;</span></em></p>
                        <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; font-size:12.5pt;"><em><span style="font-family:'Times New Roman';">&nbsp;</span></em></p>
                        <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; font-size:12.5pt;"><strong><span style="font-family:'Times New Roman';">&nbsp;</span></strong></p>
                    </td>
                    <td style="width:232.5pt; padding-right:5.4pt; padding-left:5.4pt; vertical-align:top;">
                        <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; font-size:12.5pt;"><strong><span style="font-family:'Times New Roman';">NGƯỜI SỬ DỤNG LAO ĐỘNG</span></strong></p>
                        <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; font-size:12.5pt;"><em><span style="font-family:'Times New Roman';">(K&yacute; t&ecirc;n, ghi r&otilde; họ v&agrave; t&ecirc;n ,đ&oacute;ng dấu)</span></em></p>
                        <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; font-size:12.5pt;"><em><span style="font-family:'Times New Roman';">&nbsp;</span></em></p>
                        <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; font-size:12.5pt;"><em><span style="font-family:'Times New Roman';">&nbsp;</span></em></p>
                        <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; font-size:12.5pt;"><em><span style="font-family:'Times New Roman';">&nbsp;</span></em></p>
                        <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; font-size:12.5pt;"><em><span style="font-family:'Times New Roman';">&nbsp;</span></em></p>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</div>`;

const LaborContractContent = ({
  data,
}: {
  data: {
    companyName: string;
    companyNameShort: string;
    companyLocation: string;
    companyLocationGroup: string;
    companyPhoneNumber: string;
    companyOwner: string;
    companyOwnerNationality: string;
    companyOwnerPosition: string;
    companyOwnerDOB: string;
    companyOwnerIdentityNumber: string;
    companyOwnerLocation: string;
    employeeFullName: string;
    employeeNationality: string;
    employeeDOB: string;
    employeeBirthLocation: string;
    employeeLocation: string;
    employeeIdentityNumber: string;
    employeeIdentityIssueDate: string;
    employeeIdentityCity: string;
    employeePosition: string;
    employeePositionDesc: string[];
    employeeSalary: string;
    contractLaborType: string;
    StartDate: string;
    EndDate: string;
  };
}) => {
  const htmlString = getContentHtml(data);
  return <div dangerouslySetInnerHTML={{ __html: htmlString }} />;
};

export default LaborContractContent;
